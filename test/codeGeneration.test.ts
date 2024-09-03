import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CodeGeneration } from '../codeGeneration';
import { AIInterface } from '../aiInterface';

suite('CodeGeneration Test Suite', () => {
    let codeGeneration: CodeGeneration;
    let aiInterfaceStub: sinon.SinonStubbedInstance<AIInterface>;

    setup(() => {
        aiInterfaceStub = sinon.createStubInstance(AIInterface);
        codeGeneration = new CodeGeneration(aiInterfaceStub);
    });

    teardown(() => {
        sinon.restore();
    });

    test('CodeGeneration should be instantiated', () => {
        assert.ok(codeGeneration);
    });

    test('generateCode should call AIInterface query method with correct prompt', async () => {
        const prompt = 'Generate a function to calculate factorial';
        const language = 'python';
        const expectedCode = 'def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)';

        aiInterfaceStub.query.resolves(expectedCode);

        const result = await codeGeneration.generateCode(prompt, language);

        assert.strictEqual(result, expectedCode);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string.and(sinon.match(prompt)).and(sinon.match(language))));
    });

    test('refactorCode should call AIInterface query method with correct code and instruction', async () => {
        const code = 'function add(a, b) { return a + b; }';
        const instruction = 'Add type annotations';
        const language = 'typescript';
        const expectedCode = 'function add(a: number, b: number): number { return a + b; }';

        aiInterfaceStub.query.resolves(expectedCode);

        const result = await codeGeneration.refactorCode(code, instruction, language);

        assert.strictEqual(result, expectedCode);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string.and(sinon.match(code)).and(sinon.match(instruction)).and(sinon.match(language))));
    });

    test('generateFunction should call AIInterface query method with correct function details', async () => {
        const functionName = 'calculateArea';
        const params = ['length', 'width'];
        const returnType = 'number';
        const description = 'Calculate the area of a rectangle';
        const language = 'typescript';
        const expectedCode = 'function calculateArea(length: number, width: number): number {\n    return length * width;\n}';

        aiInterfaceStub.query.resolves(expectedCode);

        const result = await codeGeneration.generateFunction(functionName, params, returnType, description, language);

        assert.strictEqual(result, expectedCode);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string.and(sinon.match(functionName)).and(sinon.match(params.join)).and(sinon.match(returnType)).and(sinon.match(description)).and(sinon.match(language))));
    });

    test('generateUnitTest should call AIInterface query method with correct code and framework', async () => {
        const code = 'function add(a: number, b: number): number { return a + b; }';
        const language = 'typescript';
        const framework = 'jest';
        const expectedTest = 'test("add function", () => {\n    expect(add(2, 3)).toBe(5);\n    expect(add(-1, 1)).toBe(0);\n});';

        aiInterfaceStub.query.resolves(expectedTest);

        const result = await codeGeneration.generateUnitTest(code, language, framework);

        assert.strictEqual(result, expectedTest);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string.and(sinon.match(code)).and(sinon.match(language)).and(sinon.match(framework))));
    });

    test('optimizeCode should call AIInterface query method with correct code to optimize', async () => {
        const code = 'function fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}';
        const language = 'javascript';
        const expectedCode = 'function fibonacci(n) {\n    let a = 0, b = 1;\n    for (let i = 2; i <= n; i++) {\n        [a, b] = [b, a + b];\n    }\n    return b;\n}';

        aiInterfaceStub.query.resolves(expectedCode);

        const result = await codeGeneration.optimizeCode(code, language);

        assert.strictEqual(result, expectedCode);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string.and(sinon.match(code)).and(sinon.match(language))));
    });

    test('generateCodeFromCurrentFile should get active editor content and generate code', async () => {
        const mockEditor = {
            document: {
                getText: sinon.stub().returns('// TODO: Implement factorial function'),
                languageId: 'python'
            }
        };

        sinon.stub(vscode.window, 'activeTextEditor').value(mockEditor);

        const expectedCode = 'def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)';
        aiInterfaceStub.query.resolves(expectedCode);

        await codeGeneration.generateCodeFromCurrentFile();

        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string.and(sinon.match('TODO: Implement factorial function')).and(sinon.match('python'))));
    });

    test('generateCodeFromCurrentFile should show error message if no active editor', async () => {
        sinon.stub(vscode.window, 'activeTextEditor').value(undefined);
        const showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');

        await codeGeneration.generateCodeFromCurrentFile();

        assert.ok(showErrorMessageStub.calledOnce);
        assert.ok(showErrorMessageStub.calledWith('No active editor found'));
    });

    test('handleAIError should show error message', async () => {
        const showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
        const error = new Error('AI query failed');

        await codeGeneration.handleAIError(error);

        assert.ok(showErrorMessageStub.calledOnce);
        assert.ok(showErrorMessageStub.calledWith('Error in AI code generation: AI query failed'));
    });

    test('insertGeneratedCode should insert code into active editor', async () => {
        const code = 'console.log("Hello, World!");';
        const mockEditor = {
            edit: sinon.stub().yields({
                insert: sinon.stub()
            })
        };

        sinon.stub(vscode.window, 'activeTextEditor').value(mockEditor);

        await codeGeneration.insertGeneratedCode(code);

        assert.ok(mockEditor.edit.calledOnce);
    });

    test('insertGeneratedCode should show error if no active editor', async () => {
        sinon.stub(vscode.window, 'activeTextEditor').value(undefined);
        const showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');

        await codeGeneration.insertGeneratedCode('console.log("Hello, World!");');

        assert.ok(showErrorMessageStub.calledOnce);
        assert.ok(showErrorMessageStub.calledWith('No active editor to insert code into'));
    });
});