import * as vscode from 'vscode';
import axios from 'axios';
import { AIProvider } from '../aiInterface';

export class OllamaProvider implements AIProvider {
    private apiUrl: string;
    private model: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.ollama');
        this.apiUrl = config.get('apiUrl', 'http://localhost:11434/api/generate');
        this.model = config.get('model', 'codellama');
    }

    public async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                prompt: prompt,
                stream: false
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.response) {
                return response.data.response;
            } else {
                throw new Error('Unexpected response format from Ollama API');
            }
        } catch (error) {
            console.error('Error calling Ollama API:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Ollama API error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Ollama API error: ${error.message}`);
            }
        }
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.apiUrl.replace('/api/generate', '/api/tags')}`);
            return response.status === 200;
        } catch (error) {
            console.error('Error checking Ollama availability:', error);
            return false;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.apiUrl.replace('/api/generate', '/api/tags')}`);
            if (response.data && response.data.models) {
                return response.data.models.map(model => model.name);
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
            return [];
        }
    }

    public setModel(model: string): void {
        this.model = model;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.ollama');
        config.update('model', model, vscode.ConfigurationTarget.Global);
    }

    public getModel(): string {
        return this.model;
    }

    public async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                prompt: prompt,
                stream: true
            }, {
                headers: {
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
                            if (parsed.response) {
                                onChunk(parsed.response);
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
                throw new Error(`Ollama API streaming error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Ollama API streaming error: ${error.message}`);
            }
        }
    }
}