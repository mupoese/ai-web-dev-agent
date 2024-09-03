import * as vscode from 'vscode';

export class UserInterface {
    private context: vscode.ExtensionContext;
    private statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "$(rocket) AI Web Dev";
        this.statusBarItem.command = 'ai-web-dev-agent.showSettings';
        this.statusBarItem.show();
        context.subscriptions.push(this.statusBarItem);
    }

    public async showSettings(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'aiWebDevSettings',
            'AI Web Dev Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = await this.getSettingsWebviewContent();

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'saveSettings':
                        await this.saveSettings(message.settings);
                        vscode.window.showInformationMessage('Settings saved successfully!');
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    public showOutputChannel(): vscode.OutputChannel {
        const channel = vscode.window.createOutputChannel("AI Web Dev");
        channel.show();
        return channel;
    }

    public async showQuickPick<T extends string>(items: T[], options: vscode.QuickPickOptions): Promise<T | undefined> {
        return vscode.window.showQuickPick<T>(items, options);
    }

    public async showInputBox(options: vscode.InputBoxOptions): Promise<string | undefined> {
        return vscode.window.showInputBox(options);
    }

    public showInformationMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    public showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    public showWarningMessage(message: string): void {
        vscode.window.showWarningMessage(message);
    }

    private async getSettingsWebviewContent(): Promise<string> {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent');
        const currentSettings = {
            aiProvider: config.get('aiProvider', 'ollama'),
            ollamaApiUrl: config.get('ollamaApiUrl', 'http://localhost:11434/api/generate'),
            huggingFaceApiUrl: config.get('huggingFaceApiUrl', 'https://api-inference.huggingface.co/models/bigcode/starcoder'),
            huggingFaceApiKey: config.get('huggingFaceApiKey', '')
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
                </style>
            </head>
            <body>
                <h1>AI Web Dev Settings</h1>
                <form id="settingsForm">
                    <label for="aiProvider">AI Provider:</label>
                    <select id="aiProvider" name="aiProvider">
                        <option value="ollama" ${currentSettings.aiProvider === 'ollama' ? 'selected' : ''}>Ollama</option>
                        <option value="huggingface" ${currentSettings.aiProvider === 'huggingface' ? 'selected' : ''}>Hugging Face</option>
                    </select>

                    <label for="ollamaApiUrl">Ollama API URL:</label>
                    <input type="text" id="ollamaApiUrl" name="ollamaApiUrl" value="${currentSettings.ollamaApiUrl}">

                    <label for="huggingFaceApiUrl">Hugging Face API URL:</label>
                    <input type="text" id="huggingFaceApiUrl" name="huggingFaceApiUrl" value="${currentSettings.huggingFaceApiUrl}">

                    <label for="huggingFaceApiKey">Hugging Face API Key:</label>
                    <input type="password" id="huggingFaceApiKey" name="huggingFaceApiKey" value="${currentSettings.huggingFaceApiKey}">

                    <button type="submit">Save Settings</button>
                </form>

                <script>
                    const vscode = acquireVsCodeApi();
                    document.getElementById('settingsForm').addEventListener('submit', (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const settings = Object.fromEntries(formData.entries());
                        vscode.postMessage({
                            command: 'saveSettings',
                            settings: settings
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }

    private async saveSettings(settings: any): Promise<void> {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent');
        await config.update('aiProvider', settings.aiProvider, vscode.ConfigurationTarget.Global);
        await config.update('ollamaApiUrl', settings.ollamaApiUrl, vscode.ConfigurationTarget.Global);
        await config.update('huggingFaceApiUrl', settings.huggingFaceApiUrl, vscode.ConfigurationTarget.Global);
        await config.update('huggingFaceApiKey', settings.huggingFaceApiKey, vscode.ConfigurationTarget.Global);
    }
}