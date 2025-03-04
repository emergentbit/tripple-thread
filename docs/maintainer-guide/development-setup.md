# Development Setup Guide

This guide will help you set up your development environment for working on Triple Thread.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git
- SQLite3 development libraries

### Installing SQLite3 Development Libraries

#### macOS
```bash
brew install sqlite3
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install sqlite3 libsqlite3-dev
```

#### Windows
Download the SQLite tools from the [official SQLite website](https://www.sqlite.org/download.html).

## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/triple-thread.git
cd triple-thread
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Project Structure

```
triple-thread/
├── src/
│   ├── db/
│   │   └── DatabaseManager.ts   # SQLite database operations
│   ├── graph/
│   │   └── GraphManager.ts      # Graph management operations
│   ├── types/
│   │   └── Triple.ts           # Type definitions and validation
│   └── index.ts                # Main entry point
├── test/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/              # Test data
├── examples/
│   ├── 01-basic-usage.ts      # Basic usage examples
│   ├── 02-named-graphs.ts     # Named graphs examples
│   ├── 03-error-handling.ts   # Error handling examples
│   └── 04-real-world-usage.ts # Real-world usage examples
├── docs/
│   ├── user-guide/            # User documentation
│   └── maintainer-guide/      # Maintainer documentation
└── scripts/                   # Development and build scripts
```

## Development Workflow

### 1. Environment Setup

Create a `.env` file in the project root:
```env
NODE_ENV=development
DEBUG=triple-thread:*
```

### 2. Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

### 3. Development Mode

Start the development environment with auto-reloading:
```bash
npm run dev
```

### 4. Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

## Database Development

### Local Database

For development, you can use either:
- In-memory database (default for tests)
- File-based database (for persistent development)

Example configuration:
```typescript
const graphManager = new GraphManager({
  dbPath: ':memory:', // or './dev.sqlite'
  enableBackup: true,
  backupPath: './backups',
  maxConnections: 5
});
```

### Database Tools

Useful SQLite commands for development:
```bash
# Open SQLite shell
sqlite3 dev.sqlite

# Common SQLite commands
.tables              # List tables
.schema triples      # Show table schema
.indices triples     # Show indices
.backup backup.sqlite # Create backup
```

## Debugging

### VSCode Configuration

Create a `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug Logging

The project uses the `debug` package for development logging:
```typescript
import debug from 'debug';
const log = debug('triple-thread:database');
log('Database operation:', operation);
```

## Performance Testing

Run performance tests:
```bash
npm run test:performance
```

Monitor memory usage:
```bash
npm run test:memory
```

## Documentation

### Building Documentation

```bash
# Generate API documentation
npm run docs

# Serve documentation locally
npm run docs:serve
```

### Example Generation

Update examples:
```bash
# Run example code
npm run examples

# Generate example documentation
npm run examples:docs
```

## Common Issues

### SQLite3 Installation

If you encounter SQLite3 installation issues:

1. Check node-gyp setup:
```bash
npm install -g node-gyp
```

2. Rebuild SQLite3:
```bash
npm rebuild sqlite3
```

### Memory Issues

If you encounter memory issues during development:

1. Increase Node.js memory limit:
```bash
export NODE_OPTIONS=--max-old-space-size=4096
```

2. Monitor memory usage:
```bash
npm run monitor:memory
```

## Best Practices

1. **Code Organization**
   - Keep files focused and single-purpose
   - Use meaningful file and directory names
   - Follow the established project structure

2. **Testing**
   - Write tests for new features
   - Maintain test coverage
   - Use appropriate test categories

3. **Documentation**
   - Update documentation for changes
   - Include JSDoc comments
   - Keep examples up-to-date

4. **Performance**
   - Profile significant changes
   - Monitor memory usage
   - Test with large datasets

5. **Error Handling**
   - Use appropriate error types
   - Include meaningful error messages
   - Maintain error recovery paths

## Getting Help

- Check existing issues on GitHub
- Join the developer chat
- Review the documentation
- Contact the maintainers

## Next Steps

- Review the [Contributing Guidelines](./contributing.md)
- Check out the [Testing Guide](./testing.md)
- Learn about the [Release Process](./releasing.md)