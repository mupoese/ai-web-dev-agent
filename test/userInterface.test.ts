import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { UserInterface } from '../userInterface';
import { AIInterface } from '../aiInterface';
import { OllamaProvider } from '../providers/ollama';
import { HuggingFaceProvider } from '../providers/huggingface';
import { GroqProvider } from '../providers/groq';
import { AnthropicProvider } from '../providers/anthropic';
import { CohereProvider } from '../providers/cohere';
import { GeminiProvider } from '../providers/gemini';
import { MistralProvider } from '../providers/mistral';
import { OpenAIProvider } from '../providers/openai';

suite('UserInterface Test Suite', () => {
    let userInterface: UserInterface;
    let aiInterfaceStub: sinon.SinonStubbedInstance<AIInterface>;
    let contextStub: sinon.SinonStubbedInstance<vscode.ExtensionContext>;

    const aiProviders = [
        { name: 'ollama', class: OllamaProvider },
        { name: 'huggingface', class: HuggingFaceProvider },
        { name: 'groq', class: GroqProvider },
        { name: 'anthropic', class: AnthropicProvider },
        { name: 'cohere', class: CohereProvider },
        { name: 'gemini', class: GeminiProvider },
        { name: 'mistral', class: MistralProvider },
        { name: 'openai', class: OpenAIProvider }
    ];

    setup(() => {
        aiInterfaceStub = sinon.createStubInstance(AIInterface);
        contextStub = {
            subscriptions: [],
            extensionPath: '/test/extension/path',
        } as any;
        userInterface = new UserInterface(contextStub, aiInterfaceStub);
    });

    teardown(() => {
        sinon.restore();
    });

    test('UserInterface should be instantiated', () => {
        assert.ok(userInterface);
    });

    test('showSettings should create a webview panel', async () => {
        const createWebviewPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns({
            webview: {
                html: '',
                onDidReceiveMessage: sinon.stub(),
            },
            onDidDispose: sinon.stub(),
        } as any);

        await userInterface.showSettings();

        assert.ok(createWebviewPanelStub.calledOnce);
        assert.ok(createWebviewPanelStub.calledWith(
            'aiWebDevSettings',
            'AI Web Dev Settings',
            vscode.ViewColumn.One,
            { enableScripts: true }
        ));
    });

    test('getWebviewContent should return HTML string with all AI providers', () => {
        const html = userInterface.getWebviewContent();

        assert.ok(typeof html === 'string');
        assert.ok(html.includes('<!DOCTYPE html>'));
        assert.ok(html.includes('<title>AI Web Dev Settings</title>'));
        
        aiProviders.forEach(provider => {
            assert.ok(html.includes(`value="${provider.name}"`), `HTML should include option for ${provider.name}`);
        });
    });

    test('saveSettings should update configuration for all AI providers', async () => {
        const settings = {
            'aiProvider': 'openai',
            'ollama.apiUrl': 'http://localhost:11434',
            'huggingface.apiKey': 'hf_test_key',
            'groq.apiKey': 'groq_test_key',
            'anthropic.apiKey': 'anthropic_test_key',
            'cohere.apiKey': 'cohere_test_key',
            'gemini.apiKey': 'gemini_test_key',
            'mistral.apiKey': 'mistral_test_key',
            'openai.apiKey': 'openai_test_key'
        };
        const updateStub = sinon.stub().resolves();
        const getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration').returns({
            update: updateStub
        } as any);

        await userInterface.saveSettings(settings);

        assert.ok(getConfigurationStub.calledWith('ai-web-dev-agent'));
        Object.entries(settings).forEach(([key, value]) => {
            assert.ok(updateStub.calledWith(key, value, vscode.ConfigurationTarget.Global));
        });
    });

    aiProviders.forEach(provider => {
        test(`setApiKey should call setApiKey on ${provider.name} provider`, async () => {
            const providerInstance = new provider.class();
            const setApiKeyStub = sinon.stub(providerInstance, 'setApiKey');
            sinon.stub(aiInterfaceStub, 'getCurrentProvider').returns(provider.name);
            (aiInterfaceStub as any)[`${provider.name}Provider`] = providerInstance;

            await userInterface.setApiKey('test_api_key');

            assert.ok(setApiKeyStub.calledOnce);
            assert.ok(setApiKeyStub.calledWith('test_api_key'));
        });

        test(`getAvailableModels should call getAvailableModels on ${provider.name} provider`, async () => {
            const providerInstance = new provider.class();
            const getAvailableModelsStub = sinon.stub(providerInstance, 'getAvailableModels').resolves(['model1', 'model2']);
            sinon.stub(aiInterfaceStub, 'getCurrentProvider').returns(provider.name);
            (aiInterfaceStub as any)[`${provider.name}Provider`] = providerInstance;

            const models = await userInterface.getAvailableModels();

            assert.deepStrictEqual(models, ['model1', 'model2']);
            assert.ok(getAvailableModelsStub.calledOnce);
        });
    });

    test('handleProviderChange should update AI provider', async () => {
        const setProviderStub = sinon.stub(aiInterfaceStub, 'setProvider');
        const showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');

        await userInterface.handleProviderChange('openai');

        assert.ok(setProviderStub.calledOnce);
        assert.ok(setProviderStub.calledWith('openai'));
        assert.ok(showInformationMessageStub.calledWith('AI provider changed to openai'));
    });

    test('updateWebviewContent should post message to webview', () => {
        const postMessageStub = sinon.stub();
        (userInterface as any).panel = { webview: { postMessage: postMessageStub } };

        userInterface.updateWebviewContent({ test: 'data' });

        assert.ok(postMessageStub.calledOnce);
        assert.ok(postMessageStub.calledWith({ command: 'updateContent', data: { test: 'data' } }));
    });

    test('registerStatusBarItem should create and show a status bar item', () => {
        const createStatusBarItemStub = sinon.stub(vscode.window, 'createStatusBarItem').returns({
            text: '',
            command: '',
            show: sinon.stub(),
        } as any);

        userInterface.registerStatusBarItem();

        assert.ok(createStatusBarItemStub.calledOnce);
        assert.ok(createStatusBarItemStub.calledWith(vscode.StatusBarAlignment.Right, 100));
        const statusBarItem = createStatusBarItemStub.firstCall.returnValue;
        assert.strictEqual(statusBarItem.text, '$(rocket) AI Web Dev');
        assert.strictEqual(statusBarItem.command, 'ai-web-dev-agent.showSettings');
        assert.ok(statusBarItem.show.calledOnce);
    });
});