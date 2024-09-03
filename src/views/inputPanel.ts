import * as vscode from 'vscode';
import { AIInterface } from '../aiInterface';

export class InputPanel {
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
                'aiWebDevInput',
                'AI Web Dev Input',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.webview.html = this.getWebviewContent();

            this.panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'submitQuery':
                            await this.handleQuery(message.text);
                            break;
                        case 'changeProvider':
                            this.aiInterface.setProvider(message.provider);
                            vscode.window.showInformationMessage(`AI provider changed to ${message.provider}`);
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

    private async handleQuery(query: string) {
        try {
            const response = await this.aiInterface.query(query);
            this.panel?.webview.postMessage({ command: 'showResponse', text: response });
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
            this.panel?.webview.postMessage({ command: 'showError', text: error.message });
        }
    }

    private getWebviewContent() {
        const currentProvider = this.aiInterface.getCurrentProvider();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Web Dev Input</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    textarea {
                        width: 100%;
                        height: 100px;
                        margin-bottom: 10px;
                    }
                    select {
                        margin-bottom: 10px;
                    }
                    #response {
                        margin-top: 20px;
                        white-space: pre-wrap;
                    }
                </style>
            </head>
            <body>
                <h2>AI Web Developer Assistant</h2>
                <select id="providerSelect">
                    <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>Ollama</option>
                    <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>Hugging Face</option>
                    <option value="groq" ${currentProvider === 'groq' ? 'selected' : ''}>Groq</option>
                    <option value="anthropic" ${currentProvider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
                    <option value="cohere" ${currentProvider === 'cohere' ? 'selected' : ''}>Cohere</option>
                    <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>Gemini</option>
                    <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>Mistral</option>
                    <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                </select>
                <textarea id="queryInput" placeholder="Enter your query here..."></textarea>
                <button id="submitButton">Submit Query</button>
                <div id="response"></div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const queryInput = document.getElementById('queryInput');
                    const submitButton = document.getElementById('submitButton');
                    const responseDiv = document.getElementById('response');
                    const providerSelect = document.getElementById('providerSelect');

                    submitButton.addEventListener('click', () => {
                        const query = queryInput.value;
                        vscode.postMessage({
                            command: 'submitQuery',
                            text: query
                        });
                    });

                    providerSelect.addEventListener('change', (event) => {
                        vscode.postMessage({
                            command: 'changeProvider',
                            provider: event.target.value
                        });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'showResponse':
                                responseDiv.textContent = message.text;
                                break;
                            case 'showError':
                                responseDiv.textContent = 'Error: ' + message.text;
                                responseDiv.style.color = 'red';
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}