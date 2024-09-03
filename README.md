# AI Web Developer Agent

AI Web Developer Agent is a powerful VSCode extension that leverages multiple AI providers to assist you in various web development tasks. From code analysis and generation to project management and debugging, this extension aims to boost your productivity and enhance your coding experience.

## Features

- **Multi-Provider AI Support**: Integrate with multiple AI providers including Ollama, Hugging Face, Groq, Anthropic, Cohere, Gemini, Mistral, and OpenAI.
- **Code Analysis**: Get AI-powered insights and suggestions for your code.
- **Code Generation**: Generate code snippets or entire functions based on your requirements.
- **Code Refactoring**: Improve your existing code with AI-assisted refactoring suggestions.
- **Project Management**: Create new project structures and manage dependencies with AI guidance.
- **AI-Assisted Debugging**: Get help in identifying and fixing bugs in your code.
- **Interactive UI**: Use dedicated input and output panels for seamless interaction with the AI.

## Requirements

- Visual Studio Code version 1.60.0 or higher
- Node.js and npm installed on your system

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "AI Web Developer Agent"
4. Click on the Install button

## Configuration

To configure the AI Web Developer Agent, go to File > Preferences > Settings and search for "AI Web Developer Agent". You can configure the following settings:

- **AI Provider**: Select your preferred AI provider (e.g., "ollama", "openai", "anthropic", etc.)
- **API Keys**: Set your API keys for each provider (e.g., "ai-web-dev-agent.openai.apiKey")
- **API URLs**: Customize API endpoints if needed
- **Models**: Select specific models for each provider

Example configuration:

```json
{
    "ai-web-dev-agent.aiProvider": "openai",
    "ai-web-dev-agent.openai.apiKey": "your-api-key-here",
    "ai-web-dev-agent.openai.model": "gpt-3.5-turbo"
}
```

## Usage

### Analyzing Code

1. Open a file you want to analyze
2. Run the command "AI: Analyze Code" from the Command Palette (Ctrl+Shift+P)
3. View the analysis results in the output panel

### Generating Code

1. Open the AI Input Panel using the command "AI: Show Input Panel"
2. Enter your code generation request
3. View the generated code in the AI Output Panel

### Refactoring Code

1. Select the code you want to refactor
2. Run the command "AI: Refactor Code" from the Command Palette
3. Choose the type of refactoring you want to perform
4. Review and apply the suggested changes

### Creating a New Project

1. Run the command "AI: Create Project" from the Command Palette
2. Follow the prompts to specify project type, name, and description
3. The AI will generate a project structure for you

### Managing Dependencies

1. Open your project's root directory in VSCode
2. Run the command "AI: Manage Dependencies" from the Command Palette
3. Choose to add, remove, or update dependencies as needed

### AI-Assisted Debugging

1. Set a breakpoint in your code
2. Start debugging your application
3. When the debugger hits the breakpoint, run the command "AI: Suggest Fix for Breakpoint"
4. Review the AI's suggestions for fixing potential issues

## AI Providers

The extension supports the following AI providers:

- Ollama
- Hugging Face
- Groq
- Anthropic
- Cohere
- Gemini
- Mistral
- OpenAI

To switch between providers, use the "AI: Show Settings" command and select your preferred provider.

## Commands

- `AI: Analyze Code`: Analyze the current file or selection
- `AI: Generate Code`: Generate code based on a prompt
- `AI: Refactor Code`: Get refactoring suggestions for selected code
- `AI: Create Project`: Create a new project structure
- `AI: Manage Dependencies`: Add, remove, or update project dependencies
- `AI: Show Settings`: Open the settings panel for the extension
- `AI: Start Debugging`: Begin an AI-assisted debugging session
- `AI: Analyze Error`: Get AI analysis for an error message
- `AI: Suggest Fix for Breakpoint`: Get fix suggestions for the current breakpoint
- `AI: Show Input Panel`: Open the AI input panel
- `AI: Show Output Panel`: Open the AI output panel

## Troubleshooting

If you encounter any issues while using the AI Web Developer Agent:

1. Ensure you have the latest version of the extension installed
2. Check that your API keys are correctly set in the extension settings
3. Verify that you have an active internet connection
4. If using Ollama, make sure the Ollama service is running on your machine

## Reporting Issues

If you encounter a bug or have a suggestion for improvement, please email the details to mupoese@gmail.com. Include the following information:

- Description of the issue or suggestion
- Steps to reproduce the problem (if applicable)
- Your VSCode version
- Your AI Web Developer Agent extension version
- Any relevant error messages or screenshots

## Privacy and Data Usage

The AI Web Developer Agent extension sends code snippets and queries to the selected AI provider for analysis and generation. Please review the privacy policy of your chosen AI provider to understand how your data is handled.

## Contributing

Contributions to the AI Web Developer Agent are welcome! If you'd like to contribute, please email your ideas or pull requests to mupoese@gmail.com.

## About This Extension

The AI Web Developer Agent is a product developed to assist web developers in their daily tasks. This extension is provided as-is, without any specific license attached.

Key points:
- This is a mup1987-developed product
- The extension is free to use
- No formal license is attached to this software
- While you're free to use the extension, please respect the intellectual property of the developers
- The developers provide no warranties or guarantees for the extension

Please note that while the extension itself is free to use, some AI providers may charge for API usage. Make sure to review the pricing and terms of your chosen AI provider.

We hope this tool enhances your web development workflow. Enjoy using the AI Web Developer Agent!

## Feedback and Support

If you encounter any issues, have suggestions for improvements, or need support, please email us at mupoese@gmail.com. We value your feedback and are committed to improving the AI Web Developer Agent to better serve the developer community.

---

We hope you find the AI Web Developer Agent helpful in your coding journey. Happy coding!