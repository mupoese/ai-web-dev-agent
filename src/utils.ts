import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class Utils {
    /**
     * Get the current workspace folder
     */
    static getWorkspaceFolder(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open');
            return undefined;
        }
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Get the content of the current active editor
     */
    static getActiveEditorContent(): string | undefined {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return undefined;
        }
        return editor.document.getText();
    }

    /**
     * Get the selected text in the current active editor
     */
    static getSelectedText(): string | undefined {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return undefined;
        }
        const selection = editor.selection;
        return editor.document.getText(selection);
    }

    /**
     * Check if a file exists
     */
    static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    /**
     * Read a file and return its content
     */
    static readFile(filePath: string): string {
        return fs.readFileSync(filePath, 'utf8');
    }

    /**
     * Write content to a file
     */
    static writeFile(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content, 'utf8');
    }

    /**
     * Ensure a directory exists, create it if it doesn't
     */
    static ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Get the relative path of a file from the workspace root
     */
    static getRelativePath(filePath: string): string | undefined {
        const workspaceFolder = this.getWorkspaceFolder();
        if (!workspaceFolder) return undefined;
        return path.relative(workspaceFolder, filePath);
    }

    /**
     * Parse JSON safely
     */
    static safeJSONParse(text: string): any {
        try {
            return JSON.parse(text);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to parse JSON: ${error}`);
            return null;
        }
    }

    /**
     * Debounce a function
     */
    static debounce(func: Function, wait: number): (...args: any[]) => void {
        let timeout: NodeJS.Timeout | null = null;
        return (...args: any[]) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    /**
     * Format a date to a string
     */
    static formatDate(date: Date): string {
        return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    }

    /**
     * Log a message to the output channel
     */
    static log(message: string, channel: vscode.OutputChannel): void {
        const timestamp = this.formatDate(new Date());
        channel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Show an error message and log it to the output channel
     */
    static showErrorAndLog(message: string, channel: vscode.OutputChannel): void {
        this.log(`ERROR: ${message}`, channel);
        vscode.window.showErrorMessage(message);
    }

    /**
     * Get the language ID of the current active editor
     */
    static getActiveEditorLanguageId(): string | undefined {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return undefined;
        }
        return editor.document.languageId;
    }

    /**
     * Check if the current workspace is a git repository
     */
    static async isGitRepository(): Promise<boolean> {
        const workspaceFolder = this.getWorkspaceFolder();
        if (!workspaceFolder) return false;
        
        const gitFolder = path.join(workspaceFolder, '.git');
        return this.fileExists(gitFolder);
    }

    /**
     * Get the current git branch name
     */
    static async getCurrentGitBranch(): Promise<string | undefined> {
        const workspaceFolder = this.getWorkspaceFolder();
        if (!workspaceFolder) return undefined;

        const gitHeadPath = path.join(workspaceFolder, '.git', 'HEAD');
        if (!this.fileExists(gitHeadPath)) return undefined;

        const content = this.readFile(gitHeadPath);
        const match = content.match(/ref: refs\/heads\/(.+)/);
        return match ? match[1] : undefined;
    }
}