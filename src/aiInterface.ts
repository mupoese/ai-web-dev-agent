import * as vscode from 'vscode';
import { OllamaProvider } from './providers/ollama';
import { HuggingFaceProvider } from './providers/huggingface';
import { GroqProvider } from './providers/groq';
import { AnthropicProvider } from './providers/anthropic';
import { CohereProvider } from './providers/cohere';
import { GeminiProvider } from './providers/gemini';
import { MistralProvider } from './providers/mistral';
import { OpenAIProvider } from './providers/openai';

export interface AIProvider {
    generateResponse(prompt: string): Promise<string>;
    isAvailable(): Promise<boolean>;
    getAvailableModels(): Promise<string[]>;
    setModel(model: string): void;
    getModel(): string;
    setApiKey(apiKey: string): void;
    streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void>;
}

export class AIInterface {
    private provider: AIProvider;
    private ollamaProvider: OllamaProvider;
    private huggingFaceProvider: HuggingFaceProvider;
    private groqProvider: GroqProvider;
    private anthropicProvider: AnthropicProvider;
    private cohereProvider: CohereProvider;
    private geminiProvider: GeminiProvider;
    private mistralProvider: MistralProvider;
    private openaiProvider: OpenAIProvider;

    constructor() {
        this.ollamaProvider = new OllamaProvider();
        this.huggingFaceProvider = new HuggingFaceProvider();
        this.groqProvider = new GroqProvider();
        this.anthropicProvider = new AnthropicProvider();
        this.cohereProvider = new CohereProvider();
        this.geminiProvider = new GeminiProvider();
        this.mistralProvider = new MistralProvider();
        this.openaiProvider = new OpenAIProvider();

        // Default to Ollama
        this.provider = this.ollamaProvider;

        // Set the provider based on the configuration
        this.setProviderFromConfig();
    }

    private setProviderFromConfig() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent');
        const providerName = config.get<string>('aiProvider', 'ollama');
        this.setProvider(providerName);
    }

    public setProvider(providerName: string) {
        switch (providerName.toLowerCase()) {
            case 'ollama':
                this.provider = this.ollamaProvider;
                break;
            case 'huggingface':
                this.provider = this.huggingFaceProvider;
                break;
            case 'groq':
                this.provider = this.groqProvider;
                break;
            case 'anthropic':
                this.provider = this.anthropicProvider;
                break;
            case 'cohere':
                this.provider = this.cohereProvider;
                break;
            case 'gemini':
                this.provider = this.geminiProvider;
                break;
            case 'mistral':
                this.provider = this.mistralProvider;
                break;
            case 'openai':
                this.provider = this.openaiProvider;
                break;
            default:
                vscode.window.showErrorMessage(`Unknown AI provider: ${providerName}. Defaulting to Ollama.`);
                this.provider = this.ollamaProvider;
        }
    }

    public async query(prompt: string): Promise<string> {
        try {
            return await this.provider.generateResponse(prompt);
        } catch (error) {
            vscode.window.showErrorMessage(`Error querying AI provider: ${error.message}`);
            return '';
        }
    }

    public async isProviderAvailable(): Promise<boolean> {
        return await this.provider.isAvailable();
    }

    public async getAvailableModels(): Promise<string[]> {
        return await this.provider.getAvailableModels();
    }

    public setModel(model: string): void {
        this.provider.setModel(model);
    }

    public getModel(): string {
        return this.provider.getModel();
    }

    public setApiKey(apiKey: string): void {
        this.provider.setApiKey(apiKey);
    }

    public async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        return await this.provider.streamResponse(prompt, onChunk);
    }

    public getCurrentProvider(): string {
        if (this.provider instanceof OllamaProvider) return 'ollama';
        if (this.provider instanceof HuggingFaceProvider) return 'huggingface';
        if (this.provider instanceof GroqProvider) return 'groq';
        if (this.provider instanceof AnthropicProvider) return 'anthropic';
        if (this.provider instanceof CohereProvider) return 'cohere';
        if (this.provider instanceof GeminiProvider) return 'gemini';
        if (this.provider instanceof MistralProvider) return 'mistral';
        if (this.provider instanceof OpenAIProvider) return 'openai';
        return 'unknown';
    }
}