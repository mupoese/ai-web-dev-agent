import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CodeAnalysis } from '../codeAnalysis';
import { AIInterface } from '../aiInterface';

suite('CodeAnalysis Test Suite', () => {
    let codeAnalysis: CodeAnalysis;
    let aiInterfaceStub: sinon.SinonStubbedInstance<AIInterface>;

    setup(() => {
        aiInterfaceStub = sinon.createStubInstance(AIInterface);
        codeAnalysis = new CodeAnalysis(aiInterfaceStub);
    });

    test('CodeAnalysis should be instantiated', () => {
        assert.ok(codeAnalysis);
    });

    test('analyzeCode should call AIInterface query method', async () => {
        const code = 'console.log("Hello, World!");';
        const language = 'javascript';
        const expectedAnalysis = 'This code prints "Hello, World!" to the console.';

        aiInterfaceStub.query.resolves(expectedAnalysis);

        const result = await codeAnalysis.analyzeCode(code, language);

        assert.strictEqual(result, expectedAnalysis);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string));
    });

    test('analyzeCurrentFile should get active editor content and analyze it', async () => {
        const mockEditor = {
            document: {
                getText: sinon.stub().returns('const x = 5;'),
                languageId: 'typescript'
            }
        };

        sinon.stub(vscode.window, 'activeTextEditor').value(mockEditor);

        const expectedAnalysis = 'This code declares a constant variable x with value 5.';
        aiInterfaceStub.query.resolves(expectedAnalysis);

        await codeAnalysis.analyzeCurrentFile();

        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string));

        sinon.restore();
    });

    test('analyzeCurrentFile should show error message if no active editor', async () => {
        sinon.stub(vscode.window, 'activeTextEditor').value(undefined);
        const showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');

        await codeAnalysis.analyzeCurrentFile();

        assert.ok(showErrorMessageStub.calledOnce);
        assert.ok(showErrorMessageStub.calledWith('No active editor found'));

        sinon.restore();
    });

    test('suggestImprovements should call AIInterface query method with improvement prompt', async () => {
        const code = 'function add(a, b) { return a + b; }';
        const language = 'javascript';
        const expectedSuggestions = 'Consider adding type annotations for better type safety.';

        aiInterfaceStub.query.resolves(expectedSuggestions);

        const result = await codeAnalysis.suggestImprovements(code, language);

        assert.strictEqual(result, expectedSuggestions);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string));
    });

    test('explainCode should call AIInterface query method with explanation prompt', async () => {
        const code = 'const result = [1, 2, 3].map(x => x * 2);';
        const language = 'javascript';
        const expectedExplanation = 'This code creates a new array by doubling each element of the original array.';

        aiInterfaceStub.query.resolves(expectedExplanation);

        const result = await codeAnalysis.explainCode(code, language);

        assert.strictEqual(result, expectedExplanation);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string));
    });

    test('detectBugs should call AIInterface query method with bug detection prompt', async () => {
        const code = 'if (x = 5) { console.log("x is 5"); }';
        const language = 'javascript';
        const expectedBugs = 'Potential bug: Assignment (=) used instead of comparison (==) in if condition.';

        aiInterfaceStub.query.resolves(expectedBugs);

        const result = await codeAnalysis.detectBugs(code, language);

        assert.strictEqual(result, expectedBugs);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match.string));
    });
});