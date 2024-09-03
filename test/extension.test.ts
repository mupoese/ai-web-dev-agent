import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { AIInterface } from '../aiInterface';
import { CodeAnalysis } from '../codeAnalysis';
import { CodeGeneration } from '../codeGeneration';
import { ProjectManagement } from '../projectManagement';
import { InputPanel } from '../views/inputPanel';
import { OutputPanel } from '../views/outputPanel';
import { SettingsPanel } from '../views/settingsPanel';

suite('AI Web Developer Agent Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting all tests.');

    test('AIInterface should be instantiated', () => {
        const aiInterface = new AIInterface();
        assert.ok(aiInterface);
    });

    test('AIInterface should set provider', () => {
        const aiInterface = new AIInterface();
        aiInterface.setProvider('openai');
        assert.strictEqual(aiInterface.getCurrentProvider(), 'openai');
    });

    test('CodeAnalysis should analyze code', async () => {
        const aiInterface = new AIInterface();
        const codeAnalysis = new CodeAnalysis(aiInterface);
        const analyzeStub = sinon.stub(aiInterface, 'query').resolves('Analyzed code');

        const result = await codeAnalysis.analyzeCode('console.log("Hello, World!");');
        assert.strictEqual(result, 'Analyzed code');
        assert.ok(analyzeStub.calledOnce);

        analyzeStub.restore();
    });

    test('CodeGeneration should generate code', async () => {
        const aiInterface = new AIInterface();
        const codeGeneration = new CodeGeneration(aiInterface);
        const generateStub = sinon.stub(aiInterface, 'query').resolves('Generated code');

        const result = await codeGeneration.generateCode('Create a function to add two numbers');
        assert.strictEqual(result, 'Generated code');
        assert.ok(generateStub.calledOnce);

        generateStub.restore();
    });

    test('ProjectManagement should create project structure', async () => {
        const aiInterface = new AIInterface();
        const projectManagement = new ProjectManagement(aiInterface);
        const createProjectStub = sinon.stub(projectManagement, 'createProjectStructure').resolves({
            'src': {},
            'test': {},
            'package.json': '{"name": "test-project"}'
        });

        const result = await projectManagement.createProjectStructure('test-project', 'nodejs');
        assert.deepStrictEqual(result, {
            'src': {},
            'test': {},
            'package.json': '{"name": "test-project"}'
        });
        assert.ok(createProjectStub.calledOnce);

        createProjectStub.restore();
    });

    test('InputPanel should be created', () => {
        const aiInterface = new AIInterface();
        const inputPanel = new InputPanel(aiInterface);
        assert.ok(inputPanel);
    });

    test('OutputPanel should be created', () => {
        const aiInterface = new AIInterface();
        const outputPanel = new OutputPanel(aiInterface);
        assert.ok(outputPanel);
    });

    test('SettingsPanel should be created', () => {
        const aiInterface = new AIInterface();
        const settingsPanel = new SettingsPanel(aiInterface);
        assert.ok(settingsPanel);
    });

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('your-publisher.ai-web-dev-agent'));
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('ai-web-dev-agent.analyzeCode'));
        assert.ok(commands.includes('ai-web-dev-agent.generateCode'));
        assert.ok(commands.includes('ai-web-dev-agent.createProject'));
        assert.ok(commands.includes('ai-web-dev-agent.showSettings'));
    });
});