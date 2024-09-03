import * as vscode from 'vscode';
import axios from 'axios';
import { AIProvider } from '../aiInterface';

export class CohereProvider implements AIProvider {
    private apiUrl: string;
    private apiKey: string;
    private model: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.cohere');
        this.apiUrl = config.get('apiUrl', 'https://api.cohere.ai/v1/generate');
        this.apiKey = config.get('apiKey', '');
        this.model = config.get('model', 'command');
    }

    public async generateResponse(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Cohere API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                prompt: prompt,
                max_tokens: 1000,
                temperature: 0.7,
                k: 0,
                stop_sequences: [],
                return_likelihoods: 'NONE'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Cohere-Version': '2022-12-06'
                }
            });

            if (response.data && response.data.generations && response.data.generations[0].text) {
                return response.data.generations[0].text;
            } else {
                throw new Error('Unexpected response format from Cohere API');
            }
        } catch (error) {
            console.error('Error calling Cohere API:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Cohere API error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Cohere API error: ${error.message}`);
            }
        }
    }

    public async isAvailable(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await axios.get('https://api.cohere.ai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Cohere-Version': '2022-12-06'
                }
            });
            return response.status === 200;
        } catch (error) {
            console.error('Error checking Cohere availability:', error);
            return false;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('Cohere API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.get('https://api.cohere.ai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Cohere-Version': '2022-12-06'
                }
            });
            
            if (response.data && response.data.models) {
                return response.data.models.map(model => model.id);
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching Cohere models:', error);
            return [];
        }
    }

    public setModel(model: string): void {
        this.model = model;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.cohere');
        config.update('model', model, vscode.ConfigurationTarget.Global);
    }

    public getModel(): string {
        return this.model;
    }

    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.cohere');
        config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    public async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Cohere API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                prompt: prompt,
                max_tokens: 1000,
                temperature: 0.7,
                k: 0,
                stop_sequences: [],
                return_likelihoods: 'NONE',
                stream: true
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Cohere-Version': '2022-12-06'
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
                                if (parsed.text) {
                                    onChunk(parsed.text);
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
                throw new Error(`Cohere API streaming error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Cohere API streaming error: ${error.message}`);
            }
        }
    }
}