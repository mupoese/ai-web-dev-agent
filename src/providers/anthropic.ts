import * as vscode from 'vscode';
import axios from 'axios';
import { AIProvider } from '../aiInterface';

export class AnthropicProvider implements AIProvider {
    private apiUrl: string;
    private apiKey: string;
    private model: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.anthropic');
        this.apiUrl = config.get('apiUrl', 'https://api.anthropic.com/v1/messages');
        this.apiKey = config.get('apiKey', '');
        this.model = config.get('model', 'claude-3-opus-20240229');
    }

    public async generateResponse(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000
            }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.content && response.data.content[0].text) {
                return response.data.content[0].text;
            } else {
                throw new Error('Unexpected response format from Anthropic API');
            }
        } catch (error) {
            console.error('Error calling Anthropic API:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Anthropic API error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Anthropic API error: ${error.message}`);
            }
        }
    }

    public async isAvailable(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await axios.get('https://api.anthropic.com/v1/models', {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });
            return response.status === 200;
        } catch (error) {
            console.error('Error checking Anthropic availability:', error);
            return false;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.get('https://api.anthropic.com/v1/models', {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });
            
            if (response.data && response.data.models) {
                return response.data.models.map(model => model.name);
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching Anthropic models:', error);
            return [];
        }
    }

    public setModel(model: string): void {
        this.model = model;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.anthropic');
        config.update('model', model, vscode.ConfigurationTarget.Global);
    }

    public getModel(): string {
        return this.model;
    }

    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.anthropic');
        config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    public async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                stream: true
            }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(Boolean);
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                resolve();
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                                    onChunk(parsed.delta.text);
                                }
                            } catch (e) {
                                console.error('Error parsing streaming response:', e);
                            }
                        }
                    }
                });

                response.data.on('end', () => {
                    resolve();
                });

                response.data.on('error', (err) => {
                    reject(new Error(`Stream error: ${err.message}`));
                });
            });
        } catch (error) {
            console.error('Error in streaming response:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Anthropic API streaming error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Anthropic API streaming error: ${error.message}`);
            }
        }
    }
}