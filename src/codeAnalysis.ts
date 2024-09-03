import * as vscode from 'vscode';
import { AIInterface } from './aiInterface';

export class CodeAnalysis {
    private aiInterface: AIInterface;

    constructor(aiInterface: AIInterface) {
        this.aiInterface = aiInterface;
    }

    public async analyzeCurrentFile(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const code = selection.isEmpty ? document.getText() : document.getText(selection);

        if (!code) {
            vscode.window.showErrorMessage('No code selected or file is empty');
            return;
        }

        const languageId = document.languageId;
        const fileName = document.fileName;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing code...",
            cancellable: false
        }, async (progress) => {
            try {
                const analysis = await this.performAnalysis(code, languageId, fileName);
                this.showAnalysisResults(analysis);
            } catch (error) {
                vscode.window.showErrorMessage(`Error during code analysis: ${error.message}`);
            }
        });
    }

    private async performAnalysis(code: string, languageId: string, fileName: string): Promise<string> {
        const prompt = `
        Analyze the following ${languageId} code from file ${fileName}:

        ${code}

        Provide a detailed analysis including:
        1. Code structure and organization
        2. Potential bugs or errors
        3. Performance considerations
        4. Best practices and adherence to coding standards
        5. Suggestions for improvement

        Format your response in Markdown.
        `;

        return await this.aiInterface.query(prompt);
    }

    private showAnalysisResults(analysis: string): void {
        const panel = vscode.window.createWebviewPanel(
            'codeAnalysis',
            'Code Analysis Results',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.getWebviewContent(analysis);
    }

    private getWebviewContent(analysis: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Analysis Results</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                }
                h1 {
                    color: #333;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 10px;
                }
                pre {
                    background-color: #f4f4f4;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 10px;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            <h1>Code Analysis Results</h1>
            <div id="analysis"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"></script>
            <script>
                const converter = new showdown.Converter();
                const analysisHtml = converter.makeHtml(${JSON.stringify(analysis)});
                document.getElementById('analysis').innerHTML = analysisHtml;
            </script>
        </body>
        </html>
        `;
    }
}