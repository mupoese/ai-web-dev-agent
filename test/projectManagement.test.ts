import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectManagement } from '../projectManagement';
import { AIInterface } from '../aiInterface';

suite('ProjectManagement Test Suite', () => {
    let projectManagement: ProjectManagement;
    let aiInterfaceStub: sinon.SinonStubbedInstance<AIInterface>;
    let workspaceFolderStub: sinon.SinonStub;

    setup(() => {
        aiInterfaceStub = sinon.createStubInstance(AIInterface);
        projectManagement = new ProjectManagement(aiInterfaceStub);
        workspaceFolderStub = sinon.stub(vscode.workspace, 'workspaceFolders').value([{ uri: { fsPath: '/test/workspace' } }]);
    });

    teardown(() => {
        sinon.restore();
    });

    test('ProjectManagement should be instantiated', () => {
        assert.ok(projectManagement);
    });

    test('createProject should call AIInterface query method and create project structure', async () => {
        const projectType = 'nodejs';
        const projectName = 'test-project';
        const projectDescription = 'A test project';
        const expectedStructure = {
            'package.json': '{"name": "test-project", "version": "1.0.0"}',
            'src': {
                'index.js': 'console.log("Hello, World!");'
            },
            'test': {}
        };

        aiInterfaceStub.query.resolves(JSON.stringify(expectedStructure));
        const fsWriteFileSync = sinon.stub(fs, 'writeFileSync');
        const fsMkdirSync = sinon.stub(fs, 'mkdirSync');

        await projectManagement.createProject(projectType, projectName, projectDescription);

        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match(projectType).and(sinon.match(projectName)).and(sinon.match(projectDescription))));
        assert.ok(fsWriteFileSync.calledWith(sinon.match('package.json'), sinon.match('{"name": "test-project", "version": "1.0.0"}')));
        assert.ok(fsWriteFileSync.calledWith(sinon.match('src/index.js'), sinon.match('console.log("Hello, World!");')));
        assert.ok(fsMkdirSync.calledWith(sinon.match('test')));
    });

    test('manageDependencies should call AIInterface query method and update package.json', async () => {
        const packageJsonContent = '{"name": "test-project", "dependencies": {}}';
        const fsReadFileSync = sinon.stub(fs, 'readFileSync').returns(packageJsonContent);
        const fsWriteFileSync = sinon.stub(fs, 'writeFileSync');
        
        aiInterfaceStub.query.resolves('{"lodash": "^4.17.21"}');

        await projectManagement.manageDependencies('add lodash');

        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match('add lodash')));
        assert.ok(fsReadFileSync.calledWith(sinon.match('package.json')));
        assert.ok(fsWriteFileSync.calledWith(sinon.match('package.json'), sinon.match('"lodash": "^4.17.21"')));
    });

    test('analyzeDependencies should call AIInterface query method and return analysis', async () => {
        const packageJsonContent = '{"name": "test-project", "dependencies": {"lodash": "^4.17.21"}}';
        sinon.stub(fs, 'readFileSync').returns(packageJsonContent);
        
        const expectedAnalysis = 'Lodash is a utility library. Consider using native JavaScript methods for better performance.';
        aiInterfaceStub.query.resolves(expectedAnalysis);

        const analysis = await projectManagement.analyzeDependencies();

        assert.strictEqual(analysis, expectedAnalysis);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match('lodash')));
    });

    test('generateProjectStructure should call AIInterface query method and return structure', async () => {
        const projectType = 'react';
        const projectName = 'my-react-app';
        const description = 'A simple React app';
        
        const expectedStructure = {
            'package.json': '{"name": "my-react-app", "dependencies": {"react": "^17.0.2"}}',
            'src': {
                'App.js': 'import React from "react"; export default function App() { return <div>Hello World</div>; }'
            },
            'public': {
                'index.html': '<!DOCTYPE html><html lang="en"><head><title>My React App</title></head><body><div id="root"></div></body></html>'
            }
        };

        aiInterfaceStub.query.resolves(JSON.stringify(expectedStructure));

        const structure = await projectManagement.generateProjectStructure(projectType, projectName, description);

        assert.deepStrictEqual(structure, expectedStructure);
        assert.ok(aiInterfaceStub.query.calledOnce);
        assert.ok(aiInterfaceStub.query.calledWithMatch(sinon.match(projectType).and(sinon.match(projectName)).and(sinon.match(description))));
    });

    test('createProjectFiles should create files and directories based on structure', async () => {
        const projectName = 'test-project';
        const structure = {
            'package.json': '{"name": "test-project"}',
            'src': {
                'index.js': 'console.log("Hello");'
            }
        };

        const fsMkdirSync = sinon.stub(fs, 'mkdirSync');
        const fsWriteFileSync = sinon.stub(fs, 'writeFileSync');

        await projectManagement.createProjectFiles(projectName, structure);

        assert.ok(fsMkdirSync.calledWith(sinon.match('test-project')));
        assert.ok(fsMkdirSync.calledWith(sinon.match('test-project/src')));
        assert.ok(fsWriteFileSync.calledWith(sinon.match('test-project/package.json'), sinon.match('{"name": "test-project"}')));
        assert.ok(fsWriteFileSync.calledWith(sinon.match('test-project/src/index.js'), sinon.match('console.log("Hello");')));
    });

    test('getWorkspaceFolder should return the current workspace folder', () => {
        const folder = projectManagement.getWorkspaceFolder();
        assert.strictEqual(folder, '/test/workspace');
    });

    test('getWorkspaceFolder should throw error if no workspace folder', () => {
        workspaceFolderStub.value(undefined);
        assert.throws(() => projectManagement.getWorkspaceFolder(), Error);
    });
});