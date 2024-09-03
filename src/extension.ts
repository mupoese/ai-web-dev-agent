import * as vscode from 'vscode';
import { AIInterface } from './aiInterface';
import { CodeAnalysis } from './codeAnalysis';
import { CodeGeneration } from './codeGeneration';
import { ProjectManagement } from './projectManagement';
import { UserInterface } from './userInterface';
import { AIDebugger } from './debugger';
import { InputPanel } from './views/inputPanel';
import { OutputPanel } from './views/outputPanel';
import { SettingsPanel } from './views/settingsPanel';
import { ProjectStructureProvider } from './views/projectStructureProvider';

export function activate(context: vscode.ExtensionContext): void {
    console.log('AI Web Developer Agent is now active!');

    // Initialize components
    const aiInterface = new AIInterface();
    const codeAnalysis = new CodeAnalysis(aiInterface);
    const codeGeneration = new CodeGeneration(aiInterface);
    const projectManagement = new ProjectManagement(aiInterface);
    const userInterface = new UserInterface(context, aiInterface);
    const aiDebugger = new AIDebugger(aiInterface);
    const inputPanel = new InputPanel(context, aiInterface);
    const outputPanel = new OutputPanel(context, aiInterface);
    const settingsPanel = new SettingsPanel(context, aiInterface);

    // Register commands
    const commands: { [key: string]: (...args: any[]) => any } = {
        'ai-web-dev-agent.analyzeCode': () => codeAnalysis.analyzeCurrentFile(),
        'ai-web-dev-agent.generateCode': () => codeGeneration.generateCode(),
        'ai-web-dev-agent.refactorCode': () => codeGeneration.refactorCode(),
        'ai-web-dev-agent.createProject': () => projectManagement.createProject(),
        'ai-web-dev-agent.manageDependencies': () => projectManagement.manageDependencies(),
        'ai-web-dev-agent.showSettings': () => settingsPanel.show(),
        'ai-web-dev-agent.startDebugging': () => aiDebugger.startDebugging(),
        'ai-web-dev-agent.analyzeError': async () => {
            const error = await vscode.window.showInputBox({ prompt: 'Enter the error message' });
            if (error) {
                await aiDebugger.analyzeError(error);
            }
        },
        'ai-web-dev-agent.suggestFixForBreakpoint': () => aiDebugger.suggestFixForBreakpoint(),
        'ai-web-dev-agent.showInputPanel': () => inputPanel.show(),
        'ai-web-dev-agent.showOutputPanel': () => outputPanel.show(),
        'ai-web-dev-agent.setOllamaApiKey': () => userInterface.setApiKey('ollama'),
        'ai-web-dev-agent.setHuggingFaceApiKey': () => userInterface.setApiKey('huggingface'),
        'ai-web-dev-agent.setGroqApiKey': () => userInterface.setApiKey('groq'),
        'ai-web-dev-agent.setAnthropicApiKey': () => userInterface.setApiKey('anthropic'),
        'ai-web-dev-agent.setCohereApiKey': () => userInterface.setApiKey('cohere'),
        'ai-web-dev-agent.setGeminiApiKey': () => userInterface.setApiKey('gemini'),
        'ai-web-dev-agent.setMistralApiKey': () => userInterface.setApiKey('mistral'),
        'ai-web-dev-agent.setOpenAIApiKey': () => userInterface.setApiKey('openai')
    };

    Object.entries(commands).forEach(([commandName, handler]) => {
        const disposable = vscode.commands.registerCommand(commandName, handler);
        context.subscriptions.push(disposable);
    });

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('ai-web-dev-agent')) {
                updateConfiguration();
            }
        })
    );

    // Initial configuration setup
    updateConfiguration();

    // Setup status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(rocket) AI Web Dev";
    statusBarItem.command = 'ai-web-dev-agent.showSettings';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register custom tree view for project structure
    const treeDataProvider = new ProjectStructureProvider(projectManagement);
    vscode.window.createTreeView('aiWebDevProjectStructure', { treeDataProvider });

    function updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration('ai-web-dev-agent');
        const aiProvider = config.get<string>('aiProvider', 'ollama');
        aiInterface.setProvider(aiProvider);
        vscode.window.showInformationMessage(`AI provider updated to: ${aiProvider}`);
    }
}

export function deactivate(): void {
    console.log('AI Web Developer Agent is now deactivated!');
}

class ProjectStructureProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    constructor(private projectManagement: ProjectManagement) {}

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            // Root of the tree, return project structure
            return Promise.resolve([new vscode.TreeItem('Project Structure', vscode.TreeItemCollapsibleState.Collapsed)]);
        } else if (element.label === 'Project Structure') {
            // TODO: Implement actual project structure retrieval
            return Promise.resolve([
                new vscode.TreeItem('src', vscode.TreeItemCollapsibleState.Collapsed),
                new vscode.TreeItem('tests', vscode.TreeItemCollapsibleState.Collapsed),
                new vscode.TreeItem('config', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        }
        return Promise.resolve([]);
    }
}

class AICodeLensProvider implements vscode.CodeLensProvider {
    constructor(private codeAnalysis: CodeAnalysis) {}

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        // TODO: Implement actual AI-based code lens suggestions
        return [
            new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
                title: "AI: Analyze this section",
                command: "ai-web-dev-agent.analyzeCode"
            })
        ];
    }
}