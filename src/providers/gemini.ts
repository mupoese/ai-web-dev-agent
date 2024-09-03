import * as vscode from 'vscode';
import axios from 'axios';
import { AIProvider } from '../aiInterface';

export class GeminiProvider implements AIProvider {
    private apiUrl: string;
    private apiKey: string;
    private model: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.gemini');
        this.apiUrl = config.get('apiUrl', 'https://generativelanguage.googleapis.com/v1beta/models');
        this.apiKey = config.get('apiKey', '');
        this.model = config.get('model', 'gemini-pro');
    }

    public async generateResponse(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Gemini API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(`${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1000,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.candidates && response.data.candidates[0].content.parts[0].text) {
                return response.data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Unexpected response format from Gemini API');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Gemini API error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Gemini API error: ${error.message}`);
            }
        }
    }

    public async isAvailable(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await axios.get(`${this.apiUrl}?key=${this.apiKey}`);
            return response.status === 200;
        } catch (error) {
            console.error('Error checking Gemini availability:', error);
            return false;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('Gemini API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.get(`${this.apiUrl}?key=${this.apiKey}`);
            
            if (response.data && response.data.models) {
                return response.data.models.map(model => model.name);
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching Gemini models:', error);
            return [];
        }
    }

    public setModel(model: string): void {
        this.model = model;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.gemini');
        config.update('model', model, vscode.ConfigurationTarget.Global);
    }

    public getModel(): string {
        return this.model;
    }

    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent.gemini');
        config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    public async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Gemini API key not set. Please set it in the extension settings.');
        }

        try {
            const response = await axios.post(`${this.apiUrl}/${this.model}:streamGenerateContent?key=${this.apiKey}`, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1000,
                }
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
                            if (parsed.candidates && parsed.candidates[0].content.parts[0].text) {
                                onChunk(parsed.candidates[0].content.parts[0].text);
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
                throw new Error(`Gemini API streaming error: ${error.response.status} ${error.response.statusText}`);
            } else {
                throw new Error(`Gemini API streaming error: ${error.message}`);
            }
        }
    }
}