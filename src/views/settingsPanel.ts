import * as vscode from 'vscode';
import { AIInterface } from '../aiInterface';

export class SettingsPanel {
    private panel: vscode.WebviewPanel | undefined;
    private aiInterface: AIInterface;

    constructor(aiInterface: AIInterface) {
        this.aiInterface = aiInterface;
    }

    public show() {
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'aiWebDevSettings',
                'AI Web Dev Settings',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.webview.html = this.getWebviewContent();

            this.panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'saveSettings':
                            await this.saveSettings(message.settings);
                            break;
                        case 'getAvailableModels':
                            await this.getAvailableModels(message.provider);
                            break;
                    }
                },
                undefined,
                []
            );

            this.panel.onDidDispose(
                () => {
                    this.panel = undefined;
                },
                null,
                []
            );
        }
    }

    private async saveSettings(settings: any) {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent');
        for (const [key, value] of Object.entries(settings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
        this.aiInterface.setProvider(settings.aiProvider);
        vscode.window.showInformationMessage('Settings saved successfully');
    }

    private async getAvailableModels(provider: string) {
        try {
            this.aiInterface.setProvider(provider);
            const models = await this.aiInterface.getAvailableModels();
            this.panel?.webview.postMessage({ command: 'updateAvailableModels', models });
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching models: ${error.message}`);
        }
    }

    private getWebviewContent() {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent');
        const currentProvider = config.get('aiProvider', 'ollama');
        const settings = {
            ollama: {
                apiUrl: config.get('ollama.apiUrl', ''),
                model: config.get('ollama.model', '')
            },
            huggingface: {
                apiUrl: config.get('huggingface.apiUrl', ''),
                apiKey: config.get('huggingface.apiKey', ''),
                model: config.get('huggingface.model', '')
            },
            groq: {
                apiUrl: config.get('groq.apiUrl', ''),
                apiKey: config.get('groq.apiKey', ''),
                model: config.get('groq.model', '')
            },
            anthropic: {
                apiUrl: config.get('anthropic.apiUrl', ''),
                apiKey: config.get('anthropic.apiKey', ''),
                model: config.get('anthropic.model', '')
            },
            cohere: {
                apiUrl: config.get('cohere.apiUrl', ''),
                apiKey: config.get('cohere.apiKey', ''),
                model: config.get('cohere.model', '')
            },
            gemini: {
                apiUrl: config.get('gemini.apiUrl', ''),
                apiKey: config.get('gemini.apiKey', ''),
                model: config.get('gemini.model', '')
            },
            mistral: {
                apiUrl: config.get('mistral.apiUrl', ''),
                apiKey: config.get('mistral.apiKey', ''),
                model: config.get('mistral.model', '')
            },
            openai: {
                apiUrl: config.get('openai.apiUrl', ''),
                apiKey: config.get('openai.apiKey', ''),
                model: config.get('openai.model', '')
            }
        };

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Web Dev Settings</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    label {
                        display: block;
                        margin-top: 10px;
                    }
                    input, select {
                        width: 100%;
                        padding: 5px;
                        margin-top: 5px;
                    }
                    button {
                        margin-top: 20px;
                        padding: 10px;
                    }
                    .provider-settings {
                        display: none;
                        margin-top: 20px;
                        border: 1px solid #ddd;
                        padding: 10px;
                    }
                </style>
            </head>
            <body>
                <h2>AI Web Developer Agent Settings</h2>
                <form id="settingsForm">
                    <label for="aiProvider">AI Provider:</label>
                    <select id="aiProvider" name="aiProvider">
                        <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>Ollama</option>
                        <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>Hugging Face</option>
                        <option value="groq" ${currentProvider === 'groq' ? 'selected' : ''}>Groq</option>
                        <option value="anthropic" ${currentProvider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
                        <option value="cohere" ${currentProvider === 'cohere' ? 'selected' : ''}>Cohere</option>
                        <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>Gemini</option>
                        <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>Mistral</option>
                        <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                    </select>

                    ${Object.entries(settings).map(([provider, providerSettings]) => `
                        <div id="${provider}Settings" class="provider-settings">
                            <label for="${provider}ApiUrl">API URL:</label>
                            <input type="text" id="${provider}ApiUrl" name="${provider}.apiUrl" value="${providerSettings.apiUrl}">
                            
                            ${provider !== 'ollama' ? `
                                <label for="${provider}ApiKey">API Key:</label>
                                <input type="password" id="${provider}ApiKey" name="${provider}.apiKey" value="${providerSettings.apiKey}">
                            ` : ''}
                            
                            <label for="${provider}Model">Model:</label>
                            <select id="${provider}Model" name="${provider}.model">
                                <option value="${providerSettings.model}">${providerSettings.model}</option>
                            </select>
                        </div>
                    `).join('')}

                    <button type="submit">Save Settings</button>
                </form>

                <script>
                    const vscode = acquireVsCodeApi();
                    const settingsForm = document.getElementById('settingsForm');
                    const aiProviderSelect = document.getElementById('aiProvider');
                    const providerSettings = document.querySelectorAll('.provider-settings');

                    function showProviderSettings(provider) {
                        providerSettings.forEach(settings => {
                            settings.style.display = settings.id === provider + 'Settings' ? 'block' : 'none';
                        });
                        vscode.postMessage({ command: 'getAvailableModels', provider });
                    }

                    aiProviderSelect.addEventListener('change', (event) => {
                        showProviderSettings(event.target.value);
                    });

                    showProviderSettings('${currentProvider}');

                    settingsForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const settings = Object.fromEntries(formData.entries());
                        vscode.postMessage({
                            command: 'saveSettings',
                            settings: settings
                        });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateAvailableModels':
                                const modelSelect = document.getElementById(aiProviderSelect.value + 'Model');
                                modelSelect.innerHTML = message.models.map(model => 
                                    `<option value="${model}">${model}</option>`
                                ).join('');
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}