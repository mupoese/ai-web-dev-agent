import * as vscode from 'vscode';
import axios from 'axios';
import { AIProvider } from '../aiInterface';

export class HuggingFaceProvider implements AIProvider {
    private apiUrl: string;
    private apiKey: string;
    private model: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.huggingface');
        this.apiUrl = config.get('apiUrl', 'https://api-inference.huggingface.co/models');
        this.apiKey = config.get('apiKey', '');
        this.model = config.get('model', 'bigcode/starcoder');
    }

    public async generateResponse(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Hugging Face API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(`${this.apiUrl}/${this.model}`, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7,
                    top_p: 0.95,
                    do_sample: true
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data[0] && response.data[0].generated_text) {
                return response.data[0].generated_text;
            } else {
                throw new Error('Unexpected response format from Hugging Face API');
            }
        } catch (error) {
            console.error('Error calling Hugging Face API:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Hugging Face API error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Hugging Face API error: ${error.message}`);
            }
        }
    }

    public async isAvailable(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await axios.get(`${this.apiUrl}/${this.model}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.status === 200;
        } catch (error) {
            console.error('Error checking Hugging Face availability:', error);
            return false;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        // Note: Hugging Face has thousands of models. Here we're returning a curated list.
        // You might want to implement a more sophisticated model selection mechanism.
        return [
            'bigcode/starcoder',
            'facebook/bart-large-cnn',
            'gpt2',
            'microsoft/DialoGPT-large',
            'distilbert-base-uncased-finetuned-sst-2-english'
        ];
    }

    public setModel(model: string): void {
        this.model = model;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.huggingface');
        config.update('model', model, vscode.ConfigurationTarget.Global);
    }

    public getModel(): string {
        return this.model;
    }

    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.huggingface');
        config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    public async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Hugging Face API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(`${this.apiUrl}/${this.model}`, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7,
                    top_p: 0.95,
                    do_sample: true,
                    stream: true
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(Boolean);
                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed[0] && parsed[0].generated_text) {
                                onChunk(parsed[0].generated_text);
                            }
                        } catch (e) {
                            console.error('Error parsing streaming response:', e);
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
                throw new Error(`Hugging Face API streaming error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Hugging Face API streaming error: ${error.message}`);
            }
        }
    }
}