import * as assert from 'assert';
import * as sinon from 'sinon';
import { AIInterface } from '../aiInterface';
import { OllamaProvider } from '../providers/ollama';
import { HuggingFaceProvider } from '../providers/huggingface';
import { GroqProvider } from '../providers/groq';
import { AnthropicProvider } from '../providers/anthropic';
import { CohereProvider } from '../providers/cohere';
import { GeminiProvider } from '../providers/gemini';
import { MistralProvider } from '../providers/mistral';
import { OpenAIProvider } from '../providers/openai';

suite('AIInterface Test Suite', () => {
    let aiInterface: AIInterface;

    setup(() => {
        aiInterface = new AIInterface();
    });

    test('AIInterface should be instantiated', () => {
        assert.ok(aiInterface);
    });

    test('AIInterface should have a default provider', () => {
        assert.strictEqual(aiInterface.getCurrentProvider(), 'ollama');
    });

    const providers = [
        'ollama',
        'huggingface',
        'groq',
        'anthropic',
        'cohere',
        'gemini',
        'mistral',
        'openai'
    ];

    providers.forEach(provider => {
        test(`setProvider should change the current provider to ${provider}`, () => {
            aiInterface.setProvider(provider);
            assert.strictEqual(aiInterface.getCurrentProvider(), provider);
        });
    });

    test('setProvider should throw an error for invalid provider', () => {
        assert.throws(() => {
            aiInterface.setProvider('invalidProvider');
        }, Error);
    });

    test('query should call the current provider\'s generateResponse method', async () => {
        const mockProvider = {
            generateResponse: sinon.stub().resolves('Mocked response'),
            isAvailable: sinon.stub().resolves(true),
            getAvailableModels: sinon.stub().resolves(['model1', 'model2']),
            setModel: sinon.stub(),
            getModel: sinon.stub().returns('default-model'),
            setApiKey: sinon.stub(),
            streamResponse: sinon.stub().resolves()
        };

        (aiInterface as any).provider = mockProvider;

        const response = await aiInterface.query('Test prompt');
        assert.strictEqual(response, 'Mocked response');
        assert.ok(mockProvider.generateResponse.calledOnce);
        assert.ok(mockProvider.generateResponse.calledWith('Test prompt'));
    });

    test('isProviderAvailable should call the current provider\'s isAvailable method', async () => {
        const mockProvider = {
            generateResponse: sinon.stub().resolves('Mocked response'),
            isAvailable: sinon.stub().resolves(true),
            getAvailableModels: sinon.stub().resolves(['model1', 'model2']),
            setModel: sinon.stub(),
            getModel: sinon.stub().returns('default-model'),
            setApiKey: sinon.stub(),
            streamResponse: sinon.stub().resolves()
        };

        (aiInterface as any).provider = mockProvider;

        const isAvailable = await aiInterface.isProviderAvailable();
        assert.strictEqual(isAvailable, true);
        assert.ok(mockProvider.isAvailable.calledOnce);
    });

    test('getAvailableModels should call the current provider\'s getAvailableModels method', async () => {
        const mockProvider = {
            generateResponse: sinon.stub().resolves('Mocked response'),
            isAvailable: sinon.stub().resolves(true),
            getAvailableModels: sinon.stub().resolves(['model1', 'model2']),
            setModel: sinon.stub(),
            getModel: sinon.stub().returns('default-model'),
            setApiKey: sinon.stub(),
            streamResponse: sinon.stub().resolves()
        };

        (aiInterface as any).provider = mockProvider;

        const models = await aiInterface.getAvailableModels();
        assert.deepStrictEqual(models, ['model1', 'model2']);
        assert.ok(mockProvider.getAvailableModels.calledOnce);
    });

    test('setModel should call the current provider\'s setModel method', () => {
        const mockProvider = {
            generateResponse: sinon.stub().resolves('Mocked response'),
            isAvailable: sinon.stub().resolves(true),
            getAvailableModels: sinon.stub().resolves(['model1', 'model2']),
            setModel: sinon.stub(),
            getModel: sinon.stub().returns('default-model'),
            setApiKey: sinon.stub(),
            streamResponse: sinon.stub().resolves()
        };

        (aiInterface as any).provider = mockProvider;

        aiInterface.setModel('new-model');
        assert.ok(mockProvider.setModel.calledOnce);
        assert.ok(mockProvider.setModel.calledWith('new-model'));
    });

    test('getModel should call the current provider\'s getModel method', () => {
        const mockProvider = {
            generateResponse: sinon.stub().resolves('Mocked response'),
            isAvailable: sinon.stub().resolves(true),
            getAvailableModels: sinon.stub().resolves(['model1', 'model2']),
            setModel: sinon.stub(),
            getModel: sinon.stub().returns('default-model'),
            setApiKey: sinon.stub(),
            streamResponse: sinon.stub().resolves()
        };

        (aiInterface as any).provider = mockProvider;

        const model = aiInterface.getModel();
        assert.strictEqual(model, 'default-model');
        assert.ok(mockProvider.getModel.calledOnce);
    });

    test('setApiKey should call the current provider\'s setApiKey method', () => {
        const mockProvider = {
            generateResponse: sinon.stub().resolves('Mocked response'),
            isAvailable: sinon.stub().resolves(true),
            getAvailableModels: sinon.stub().resolves(['model1', 'model2']),
            setModel: sinon.stub(),
            getModel: sinon.stub().returns('default-model'),
            setApiKey: sinon.stub(),
            streamResponse: sinon.stub().resolves()
        };

        (aiInterface as any).provider = mockProvider;

        aiInterface.setApiKey('new-api-key');
        assert.ok(mockProvider.setApiKey.calledOnce);
        assert.ok(mockProvider.setApiKey.calledWith('new-api-key'));
    });

    test('streamResponse should call the current provider\'s streamResponse method', async () => {
        const mockProvider = {
            generateResponse: sinon.stub().resolves('Mocked response'),
            isAvailable: sinon.stub().resolves(true),
            getAvailableModels: sinon.stub().resolves(['model1', 'model2']),
            setModel: sinon.stub(),
            getModel: sinon.stub().returns('default-model'),
            setApiKey: sinon.stub(),
            streamResponse: sinon.stub().resolves()
        };

        (aiInterface as any).provider = mockProvider;

        const onChunk = sinon.stub();
        await aiInterface.streamResponse('Test prompt', onChunk);
        assert.ok(mockProvider.streamResponse.calledOnce);
        assert.ok(mockProvider.streamResponse.calledWith('Test prompt', onChunk));
    });

    providers.forEach(provider => {
        test(`${provider} provider should be instantiated correctly`, () => {
            aiInterface.setProvider(provider);
            const currentProvider = (aiInterface as any).provider;
            switch(provider) {
                case 'ollama':
                    assert.ok(currentProvider instanceof OllamaProvider);
                    break;
                case 'huggingface':
                    assert.ok(currentProvider instanceof HuggingFaceProvider);
                    break;
                case 'groq':
                    assert.ok(currentProvider instanceof GroqProvider);
                    break;
                case 'anthropic':
                    assert.ok(currentProvider instanceof AnthropicProvider);
                    break;
                case 'cohere':
                    assert.ok(currentProvider instanceof CohereProvider);
                    break;
                case 'gemini':
                    assert.ok(currentProvider instanceof GeminiProvider);
                    break;
                case 'mistral':
                    assert.ok(currentProvider instanceof MistralProvider);
                    break;
                case 'openai':
                    assert.ok(currentProvider instanceof OpenAIProvider);
                    break;
            }
        });
    });
});