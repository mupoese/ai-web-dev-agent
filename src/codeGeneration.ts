import * as vscode from 'vscode';
import { AIInterface } from './aiInterface';

export class CodeGeneration {
    private aiInterface: AIInterface;

    constructor(aiInterface: AIInterface) {
        this.aiInterface = aiInterface;
    }

    public async generateCode(): Promise<void> {
        const languageId = await this.promptForLanguage();
        if (!languageId) return;

        const specification = await vscode.window.showInputBox({
            prompt: "Enter a description of the code you want to generate",
            placeHolder: "E.g., 'A function that calculates the Fibonacci sequence'"
        });

        if (!specification) return;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating code...",
            cancellable: false
        }, async (progress) => {
            try {
                const generatedCode = await this.performCodeGeneration(specification, languageId);
                this.insertGeneratedCode(generatedCode, languageId);
            } catch (error) {
                vscode.window.showErrorMessage(`Error during code generation: ${error.message}`);
            }
        });
    }

    public async refactorCode(): Promise<void> {
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

        const refactorType = await vscode.window.showQuickPick([
            'Improve readability',
            'Optimize performance',
            'Add comments',
            'Convert to modern syntax'
        ], { placeHolder: 'Select refactor type' });

        if (!refactorType) return;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Refactoring code...",
            cancellable: false
        }, async (progress) => {
            try {
                const refactoredCode = await this.performCodeRefactoring(code, languageId, refactorType);
                this.replaceCode(editor, selection, refactoredCode);
            } catch (error) {
                vscode.window.showErrorMessage(`Error during code refactoring: ${error.message}`);
            }
        });
    }

    private async promptForLanguage(): Promise<string | undefined> {
        const languages = await vscode.languages.getLanguages();
        return vscode.window.showQuickPick(languages, {
            placeHolder: 'Select the programming language'
        });
    }

    private async performCodeGeneration(specification: string, languageId: string): Promise<string> {
        const prompt = `
        Generate ${languageId} code for the following specification:

        ${specification}

        Provide only the code without any additional explanation.
        `;

        return await this.aiInterface.query(prompt);
    }

    private async performCodeRefactoring(code: string, languageId: string, refactorType: string): Promise<string> {
        const prompt = `
        Refactor the following ${languageId} code to ${refactorType}:

        ${code}

        Provide only the refactored code without any additional explanation.
        `;

        return await this.aiInterface.query(prompt);
    }

    private insertGeneratedCode(code: string, languageId: string): void {
        const snippet = new vscode.SnippetString(code);
        const editor = vscode.window.activeTextEditor;
        
        if (editor) {
            editor.insertSnippet(snippet);
        } else {
            vscode.workspace.openTextDocument({ language: languageId, content: code })
                .then(doc => vscode.window.showTextDocument(doc));
        }
    }

    private replaceCode(editor: vscode.TextEditor, selection: vscode.Selection, newCode: string): void {
        editor.edit(editBuilder => {
            if (selection.isEmpty) {
                editBuilder.replace(new vscode.Range(0, 0, editor.document.lineCount, 0), newCode);
            } else {
                editBuilder.replace(selection, newCode);
            }
        });
    }
}