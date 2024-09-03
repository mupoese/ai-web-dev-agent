import * as vscode from 'vscode';
import { AIInterface } from './aiInterface';
import { Utils } from './utils';

export class AIDebugger {
    private aiInterface: AIInterface;
    private outputChannel: vscode.OutputChannel;

    constructor(aiInterface: AIInterface) {
        this.aiInterface = aiInterface;
        this.outputChannel = vscode.window.createOutputChannel('AI Debugger');
    }

    public async startDebugging(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const code = document.getText();
        const languageId = document.languageId;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "AI Debugging in progress...",
            cancellable: false
        }, async (progress) => {
            try {
                const debugSuggestions = await this.getDebugSuggestions(code, languageId);
                this.showDebugSuggestions(debugSuggestions);
            } catch (error) {
                vscode.window.showErrorMessage(`Error during AI debugging: ${error.message}`);
            }
        });
    }

    public async analyzeError(error: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const code = document.getText();
        const languageId = document.languageId;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing error...",
            cancellable: false
        }, async (progress) => {
            try {
                const errorAnalysis = await this.getErrorAnalysis(code, error, languageId);
                this.showErrorAnalysis(errorAnalysis);
            } catch (error) {
                vscode.window.showErrorMessage(`Error during error analysis: ${error.message}`);
            }
        });
    }

    public async suggestFixForBreakpoint(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const code = document.getText();
        const breakpointLine = selection.active.line;
        const languageId = document.languageId;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Suggesting fix for breakpoint...",
            cancellable: false
        }, async (progress) => {
            try {
                const fixSuggestion = await this.getFixSuggestionForBreakpoint(code, breakpointLine, languageId);
                this.showFixSuggestion(fixSuggestion);
            } catch (error) {
                vscode.window.showErrorMessage(`Error suggesting fix: ${error.message}`);
            }
        });
    }

    private async getDebugSuggestions(code: string, languageId: string): Promise<string> {
        const prompt = `
        Analyze the following ${languageId} code for potential bugs and provide debugging suggestions:

        ${code}

        Please provide:
        1. Potential logical errors or bugs
        2. Suggestions for adding strategic debug logging
        3. Recommendations for error handling improvements
        4. Any performance considerations

        Format your response in Markdown.
        `;

        return await this.aiInterface.query(prompt);
    }

    private async getErrorAnalysis(code: string, error: string, languageId: string): Promise<string> {
        const prompt = `
        Analyze the following ${languageId} code and the error message:

        Code:
        ${code}

        Error:
        ${error}

        Please provide:
        1. An explanation of what might be causing the error
        2. Suggestions for fixing the error
        3. Any additional context or considerations

        Format your response in Markdown.
        `;

        return await this.aiInterface.query(prompt);
    }

    private async getFixSuggestionForBreakpoint(code: string, breakpointLine: number, languageId: string): Promise<string> {
        const prompt = `
        Analyze the following ${languageId} code, focusing on line ${breakpointLine + 1}:

        ${code}

        A breakpoint has been set on line ${breakpointLine + 1}. Please provide:
        1. An analysis of what the code is doing at this point
        2. Potential issues that might occur at or before this line
        3. Suggestions for improving or fixing the code around this breakpoint
        4. Recommendations for what to check when the breakpoint is hit during debugging

        Format your response in Markdown.
        `;

        return await this.aiInterface.query(prompt);
    }

    private showDebugSuggestions(suggestions: string): void {
        this.showWebview('AI Debug Suggestions', suggestions);
    }

    private showErrorAnalysis(analysis: string): void {
        this.showWebview('AI Error Analysis', analysis);
    }

    private showFixSuggestion(suggestion: string): void {
        this.showWebview('AI Fix Suggestion', suggestion);
    }

    private showWebview(title: string, content: string): void {
        const panel = vscode.window.createWebviewPanel(
            'aiDebugger',
            title,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
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
            <h1>${title}</h1>
            <div id="content"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"></script>
            <script>
                const converter = new showdown.Converter();
                const contentHtml = converter.makeHtml(${JSON.stringify(content)});
                document.getElementById('content').innerHTML = contentHtml;
            </script>
        </body>
        </html>
        `;
    }
}