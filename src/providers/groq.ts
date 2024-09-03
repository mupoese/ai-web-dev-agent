import * as vscode from 'vscode';
import axios from 'axios';
import { AIProvider } from '../aiInterface';

export class GroqProvider implements AIProvider {
    private apiUrl: string;
    private apiKey: string;
    private model: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.groq');
        this.apiUrl = config.get('apiUrl', 'https://api.groq.com/openai/v1/chat/completions');
        this.apiKey = config.get('apiKey', '');
        this.model = config.get('model', 'mixtral-8x7b-32768');
    }

    public async generateResponse(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Groq API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.7,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.choices && response.data.choices[0].message) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error('Unexpected response format from Groq API');
            }
        } catch (error) {
            console.error('Error calling Groq API:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Groq API error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Groq API error: ${error.message}`);
            }
        }
    }

    public async isAvailable(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await axios.get('https://api.groq.com/openai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.status === 200;
        } catch (error) {
            console.error('Error checking Groq availability:', error);
            return false;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('Groq API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.get('https://api.groq.com/openai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (response.data && response.data.data) {
                return response.data.data.map(model => model.id);
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching Groq models:', error);
            return [];
        }
    }

    public setModel(model: string): void {
        this.model = model;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.groq');
        config.update('model', model, vscode.ConfigurationTarget.Global);
    }

    public getModel(): string {
        return this.model;
    }

    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.groq');
        config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    public async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Groq API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(this.apiUrl, {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.7,
                stream: true
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
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                resolve();
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                    onChunk(parsed.choices[0].delta.content);
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
                throw new Error(`Groq API streaming error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Groq API streaming error: ${error.message}`);
            }
        }
    }
}