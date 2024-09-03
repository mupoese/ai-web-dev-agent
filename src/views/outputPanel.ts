import * as vscode from 'vscode';
import { AIInterface } from '../aiInterface';

export class OutputPanel {
    private panel: vscode.WebviewPanel | undefined;
    private aiInterface: AIInterface;

    constructor(aiInterface: AIInterface) {
        this.aiInterface = aiInterface;
    }

    public show(initialContent: string = '') {
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'aiWebDevOutput',
                'AI Web Dev Output',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.webview.html = this.getWebviewContent(initialContent);

            this.panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'insertCode':
                            await this.insertCodeIntoEditor(message.code);
                            break;
                        case 'explainCode':
                            await this.explainCode(message.code);
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

    public update(content: string) {
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'updateContent', content });
        } else {
            this.show(content);
        }
    }

    private async insertCodeIntoEditor(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, code);
            });
            vscode.window.showInformationMessage('Code inserted into editor');
        } else {
            vscode.window.showErrorMessage('No active text editor');
        }
    }

    private async explainCode(code: string) {
        try {
            const explanation = await this.aiInterface.query(`Explain the following code:\n\n${code}`);
            this.update(explanation);
        } catch (error) {
            vscode.window.showErrorMessage(`Error explaining code: ${error.message}`);
        }
    }

    private getWebviewContent(initialContent: string) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Web Dev Output</title>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" rel="stylesheet" />
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        line-height: 1.6;
                    }
                    pre {
                        background-color: #f4f4f4;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 10px;
                    }
                    button {
                        margin-right: 10px;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div id="content">${this.escapeHtml(initialContent)}</div>
                <div id="actions" style="display: none;">
                    <button id="insertButton">Insert Code</button>
                    <button id="explainButton">Explain Code</button>
                </div>

                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-javascript.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-python.min.js"></script>
                <script>
                    const vscode = acquireVsCodeApi();
                    const contentDiv = document.getElementById('content');
                    const actionsDiv = document.getElementById('actions');
                    const insertButton = document.getElementById('insertButton');
                    const explainButton = document.getElementById('explainButton');

                    let currentCode = '';

                    function updateContent(content) {
                        contentDiv.innerHTML = content;
                        Prism.highlightAll();
                        
                        const codeBlocks = contentDiv.querySelectorAll('pre code');
                        if (codeBlocks.length > 0) {
                            currentCode = codeBlocks[0].textContent;
                            actionsDiv.style.display = 'block';
                        } else {
                            actionsDiv.style.display = 'none';
                        }
                    }

                    updateContent(contentDiv.innerHTML);

                    insertButton.addEventListener('click', () => {
                        vscode.postMessage({ command: 'insertCode', code: currentCode });
                    });

                    explainButton.addEventListener('click', () => {
                        vscode.postMessage({ command: 'explainCode', code: currentCode });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateContent':
                                updateContent(message.content);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    private escapeHtml(unsafe: string) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
}