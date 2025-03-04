# Contributing Guidelines

Thank you for your interest in contributing to Triple Thread! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a new branch for your contribution
4. Make your changes
5. Submit a pull request

## Development Process

### 1. Setting Up

Follow the [Development Setup Guide](./development-setup.md) to set up your development environment.

### 2. Making Changes

#### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Keep functions focused and single-purpose
- Add JSDoc comments for public APIs
- Follow the existing code style

#### Commit Messages

Format:
```
type(scope): description

[optional body]
[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- perf: Performance improvements
- test: Adding or modifying tests
- chore: Maintenance tasks

Example:
```
feat(graph): add support for named graphs

- Implement named graph storage
- Add graph-specific querying
- Update documentation
```

### 3. Testing

#### Required Tests

All changes must include appropriate tests:

- Unit tests for new features
- Integration tests for component interaction
- Performance tests for optimizations
- Edge case tests for bug fixes

#### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage
```

### 4. Documentation

Update documentation for any changes:

- Update relevant README sections
- Add/modify API documentation
- Update examples if needed
- Add migration guides for breaking changes

### 5. Pull Request Process

1. **Branch Naming**
   - feature/description
   - fix/description
   - docs/description
   - refactor/description

2. **PR Description**
   - Clear description of changes
   - Reference related issues
   - List breaking changes
   - Include upgrade steps if needed

3. **Review Process**
   - Address review comments
   - Keep the PR focused
   - Maintain a clean commit history

## Project Structure

### Core Components

```
src/
├── db/
│   └── DatabaseManager.ts   # Database operations
├── graph/
│   └── GraphManager.ts      # Graph management
└── types/
    └── Triple.ts           # Type definitions
```

### Key Interfaces

```typescript
interface Triple {
  subject: string;
  predicate: string;
  object: string;
  graph?: string;
  _delete?: boolean;
}

interface GraphManagerOptions {
  dbPath?: string;
  enableBackup?: boolean;
  backupPath?: string;
  maxConnections?: number;
  backupConfig?: {
    interval: number;
    maxBackups?: number;
  };
}
```

## Feature Guidelines

### Adding New Features

1. **Discussion First**
   - Open an issue for discussion
   - Get feedback on the design
   - Consider alternatives

2. **Implementation**
   - Follow SOLID principles
   - Keep changes focused
   - Consider performance
   - Add proper validation

3. **Documentation**
   - Add API documentation
   - Update examples
   - Include usage guides

### Modifying Existing Features

1. **Backward Compatibility**
   - Maintain existing APIs
   - Add deprecation notices
   - Provide migration paths

2. **Performance Impact**
   - Profile changes
   - Test with large datasets
   - Document any trade-offs

## Error Handling

### Guidelines

1. **Error Types**
   - Use appropriate error classes
   - Add meaningful messages
   - Include error context

2. **Validation**
   - Validate inputs early
   - Use strong types
   - Handle edge cases

3. **Recovery**
   - Clean up resources
   - Maintain data integrity
   - Log meaningful information

## Performance Considerations

### Guidelines

1. **Database Operations**
   - Use appropriate indexes
   - Optimize queries
   - Handle large datasets

2. **Memory Management**
   - Control memory usage
   - Clean up resources
   - Use streaming when appropriate

3. **Concurrency**
   - Handle multiple connections
   - Manage transactions
   - Prevent deadlocks

## Release Process

### Version Numbers

Follow semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Release Steps

1. Update version number
2. Update CHANGELOG.md
3. Create release notes
4. Tag the release
5. Publish to npm

## Getting Help

- Check existing issues
- Join discussions
- Read documentation
- Contact maintainers

## Additional Resources

- [Architecture Guide](./architecture.md)
- [Development Setup](./development-setup.md)
- [Testing Guide](./testing.md)
- [Release Process](./releasing.md)

## License

By contributing, you agree that your contributions will be licensed under the project's license.