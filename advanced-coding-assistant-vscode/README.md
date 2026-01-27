# Advanced Coding Assistant

An advanced coding assistant extension for Visual Studio Code.

## Description

This VS Code extension provides advanced coding assistance features to enhance developer productivity and code quality.

## Features

- AI-powered coding assistance
- Context-aware code suggestions
- Seamless integration with VS Code

## Requirements

- Visual Studio Code version 1.108.1 or higher
- Node.js 18.x or higher (for development)

## Installation

### From VSIX Package

1. Download the latest `.vsix` package from the releases page
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
4. Click on the "..." menu at the top-right of the Extensions view
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file

### From Marketplace (Coming Soon)

Search for "Advanced Coding Assistant" in the VS Code Extensions Marketplace.

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Visual Studio Code

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/bitsInnovate00/advanced-coding-assistant-backend.git
   cd advanced-coding-assistant-backend/advanced-coding-assistant-vscode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Development Workflow

#### Compiling

```bash
npm run compile        # Compile once
npm run watch          # Compile and watch for changes
```

#### Linting and Formatting

```bash
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
npm run format:check   # Check formatting without making changes
```

#### Testing

```bash
npm test               # Run all tests
npm run pretest        # Compile and lint before testing
```

#### Debugging

1. Open the project in VS Code
2. Press F5 to open a new Extension Development Host window
3. The extension will be loaded and you can test it
4. Set breakpoints in your code to debug

#### Packaging

```bash
npm run package        # Create production build
```

To create a VSIX package for distribution:

```bash
npm install -g @vscode/vsce
vsce package
```

### Project Structure

```
advanced-coding-assistant-vscode/
├── src/                     # Source code
│   ├── extension.ts         # Extension entry point
│   └── test/                # Tests
├── dist/                    # Compiled output (webpack)
├── out/                     # Compiled output (tests)
├── .vscode/                 # VS Code configuration
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript configuration
├── webpack.config.js        # Webpack configuration
├── eslint.config.mjs        # ESLint configuration
└── .prettierrc.json         # Prettier configuration
```

## Extension Settings

This extension contributes the following settings:

* Currently no settings are exposed. Settings will be added as features are developed.

## Known Issues

No known issues at this time. Please report any issues on the [GitHub repository](https://github.com/bitsInnovate00/advanced-coding-assistant-backend/issues).

## Release Notes

### 0.0.1

Initial scaffolding and project setup.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the [GitHub repository](https://github.com/bitsInnovate00/advanced-coding-assistant-backend/issues).

---

**Enjoy coding with Advanced Coding Assistant!**

