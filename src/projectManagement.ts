import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AIInterface } from './aiInterface';

export class ProjectManagement {
    private aiInterface: AIInterface;

    constructor(aiInterface: AIInterface) {
        this.aiInterface = aiInterface;
    }

    public async createProject(): Promise<void> {
        const projectType = await vscode.window.showQuickPick([
            'React',
            'Node.js Express',
            'Python Flask',
            'Vue.js',
            'Angular',
            'Django',
            'Other'
        ], { placeHolder: 'Select project type' });

        if (!projectType) return;

        const projectName = await vscode.window.showInputBox({
            prompt: "Enter project name",
            placeHolder: "my-awesome-project"
        });

        if (!projectName) return;

        const projectDescription = await vscode.window.showInputBox({
            prompt: "Enter project description (optional)",
            placeHolder: "A brief description of your project"
        });

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Creating project...",
            cancellable: false
        }, async (progress) => {
            try {
                const projectStructure = await this.generateProjectStructure(projectType, projectName, projectDescription);
                await this.createProjectFiles(projectName, projectStructure);
                vscode.window.showInformationMessage(`Project ${projectName} created successfully!`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error creating project: ${error.message}`);
            }
        });
    }

    public async manageDependencies(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const packageJsonPath = path.join(path.dirname(document.fileName), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            vscode.window.showErrorMessage('No package.json found in the current directory');
            return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const action = await vscode.window.showQuickPick([
            'Add dependency',
            'Remove dependency',
            'Update dependencies',
            'Analyze dependencies'
        ], { placeHolder: 'Select action' });

        if (!action) return;

        switch (action) {
            case 'Add dependency':
                await this.addDependency(packageJson, packageJsonPath);
                break;
            case 'Remove dependency':
                await this.removeDependency(packageJson, packageJsonPath);
                break;
            case 'Update dependencies':
                await this.updateDependencies(packageJson, packageJsonPath);
                break;
            case 'Analyze dependencies':
                await this.analyzeDependencies(packageJson);
                break;
        }
    }

    private async generateProjectStructure(projectType: string, projectName: string, description?: string): Promise<string> {
        const prompt = `
        Generate a project structure for a ${projectType} project named "${projectName}".
        ${description ? `The project description is: "${description}"` : ''}

        Provide the project structure in the following format:
        - folder_name/
          - file_name.ext
          - subfolder_name/
            - file_name.ext

        Include common files and folders for a ${projectType} project, such as configuration files, 
        source code directories, and test directories. Also, provide the content for key files like 
        package.json, README.md, and the main application file.

        For each file, provide the content in the following format:
        --- filename.ext ---
        [File content here]
        --- End of filename.ext ---

        `;

        return await this.aiInterface.query(prompt);
    }

    private async createProjectFiles(projectName: string, projectStructure: string): Promise<void> {
        const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!rootPath) {
            throw new Error('No workspace folder found');
        }

        const projectPath = path.join(rootPath, projectName);
        fs.mkdirSync(projectPath, { recursive: true });

        const lines = projectStructure.split('\n');
        let currentPath = projectPath;
        let currentFileContent = '';
        let currentFileName = '';

        for (const line of lines) {
            if (line.startsWith('- ')) {
                const name = line.slice(2);
                if (name.endsWith('/')) {
                    currentPath = path.join(currentPath, name);
                    fs.mkdirSync(currentPath, { recursive: true });
                } else {
                    fs.writeFileSync(path.join(currentPath, name), '');
                }
            } else if (line.startsWith('--- ') && line.endsWith(' ---')) {
                if (currentFileName) {
                    fs.writeFileSync(path.join(projectPath, currentFileName), currentFileContent.trim());
                }
                currentFileName = line.slice(4, -4);
                currentFileContent = '';
            } else if (line === `--- End of ${currentFileName} ---`) {
                fs.writeFileSync(path.join(projectPath, currentFileName), currentFileContent.trim());
                currentFileName = '';
                currentFileContent = '';
            } else if (currentFileName) {
                currentFileContent += line + '\n';
            }
        }
    }

    private async addDependency(packageJson: any, packageJsonPath: string): Promise<void> {
        const dependencyName = await vscode.window.showInputBox({
            prompt: "Enter dependency name",
            placeHolder: "e.g., lodash"
        });

        if (!dependencyName) return;

        const dependencyType = await vscode.window.showQuickPick([
            'dependencies',
            'devDependencies'
        ], { placeHolder: 'Select dependency type' });

        if (!dependencyType) return;

        packageJson[dependencyType] = packageJson[dependencyType] || {};
        packageJson[dependencyType][dependencyName] = "^1.0.0"; // You might want to let the user specify the version

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        vscode.window.showInformationMessage(`Added ${dependencyName} to ${dependencyType}`);
    }

    private async removeDependency(packageJson: any, packageJsonPath: string): Promise<void> {
        const dependencies = [
            ...Object.keys(packageJson.dependencies || {}),
            ...Object.keys(packageJson.devDependencies || {})
        ];

        const dependencyToRemove = await vscode.window.showQuickPick(dependencies, {
            placeHolder: 'Select dependency to remove'
        });

        if (!dependencyToRemove) return;

        if (packageJson.dependencies && packageJson.dependencies[dependencyToRemove]) {
            delete packageJson.dependencies[dependencyToRemove];
        } else if (packageJson.devDependencies && packageJson.devDependencies[dependencyToRemove]) {
            delete packageJson.devDependencies[dependencyToRemove];
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        vscode.window.showInformationMessage(`Removed ${dependencyToRemove}`);
    }

    private async updateDependencies(packageJson: any, packageJsonPath: string): Promise<void> {
        // This is a simplified version. In a real-world scenario, you'd want to use a package manager like npm or yarn to update dependencies.
        for (const depType of ['dependencies', 'devDependencies']) {
            if (packageJson[depType]) {
                for (const dep in packageJson[depType]) {
                    packageJson[depType][dep] = "^1.0.0"; // Update to latest version (simplified)
                }
            }
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        vscode.window.showInformationMessage('Dependencies updated. Please run npm install or yarn to apply changes.');
    }

    private async analyzeDependencies(packageJson: any): Promise<void> {
        const dependencies = [
            ...Object.entries(packageJson.dependencies || {}),
            ...Object.entries(packageJson.devDependencies || {})
        ];

        const prompt = `
        Analyze the following dependencies for a project:

        ${dependencies.map(([name, version]) => `${name}: ${version}`).join('\n')}

        Provide a brief analysis including:
        1. Any potential security vulnerabilities
        2. Suggestions for updating outdated packages
        3. Identification of unused or redundant dependencies
        4. Recommendations for alternative packages if applicable

        Format your response in Markdown.
        `;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing dependencies...",
            cancellable: false
        }, async (progress) => {
            try {
                const analysis = await this.aiInterface.query(prompt);
                this.showDependencyAnalysis(analysis);
            } catch (error) {
                vscode.window.showErrorMessage(`Error analyzing dependencies: ${error.message}`);
            }
        });
    }

    private showDependencyAnalysis(analysis: string): void {
        const panel = vscode.window.createWebviewPanel(
            'dependencyAnalysis',
            'Dependency Analysis',
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
            <title>Dependency Analysis</title>
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
            <h1>Dependency Analysis</h1>
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