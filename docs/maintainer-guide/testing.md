# Testing Guide

This guide covers testing practices and requirements for Tripple Thread.

## Overview

The project uses Jest as the testing framework and maintains 100% code coverage. Tests are written in TypeScript and follow a behavior-driven development (BDD) style.

## Test Structure

### Directory Organization

```
tripple-thread/
├── __tests__/
│   ├── db/
│   │   └── DatabaseManager.test.ts
│   ├── graph/
│   │   └── GraphManager.test.ts
│   ├── types/
│   │   └── Triple.test.ts
│   └── integration/
│       └── end-to-end.test.ts
```

### Test Categories

1. **Unit Tests**
   - Test individual components
   - Mock dependencies
   - Fast execution

2. **Integration Tests**
   - Test component interactions
   - Use real database
   - End-to-end workflows

3. **Performance Tests**
   - Load testing
   - Concurrency testing
   - Memory usage

## Writing Tests

### Test File Template

```typescript
import { GraphManager } from '../src/graph/GraphManager';
import { Triple } from '../src/types/Triple';
import {
  ValidationError,
  DatabaseError
} from '../src/errors';

describe('GraphManager', () => {
  let manager: GraphManager;

  beforeEach(() => {
    manager = new GraphManager(':memory:');
  });

  afterEach(async () => {
    await manager.close();
  });

  describe('addTriple', () => {
    it('should add valid triple', async () => {
      // Test implementation
    });

    it('should throw on invalid triple', async () => {
      // Test implementation
    });
  });
});
```

### Test Patterns

1. **Arrange-Act-Assert**
   ```typescript
   it('should query by subject', async () => {
     // Arrange
     const triple = {
       subject: 'http://example.org/john',
       predicate: 'http://example.org/name',
       object: '"John Doe"'
     };
     await manager.addTriple(triple);

     // Act
     const results = await manager.query(triple.subject);

     // Assert
     expect(results).toHaveLength(1);
     expect(results[0]).toEqual(triple);
   });
   ```

2. **Error Testing**
   ```typescript
   it('should throw on invalid URI', async () => {
     const invalid = {
       subject: 'not-a-uri',
       predicate: 'http://example.org/name',
       object: '"John"'
     };

     await expect(
       manager.addTriple(invalid)
     ).rejects.toThrow(ValidationError);
   });
   ```

3. **Async Testing**
   ```typescript
   it('should handle concurrent operations', async () => {
     const operations = Array.from(
       { length: 100 },
       (_, i) => manager.addTriple({
         subject: `http://example.org/item${i}`,
         predicate: 'http://example.org/index',
         object: `"${i}"`
       })
     );

     await expect(
       Promise.all(operations)
     ).resolves.not.toThrow();
   });
   ```

## Test Helpers

### Common Fixtures

```typescript
// __tests__/fixtures/triples.ts
export const sampleTriples = [
  {
    subject: 'http://example.org/john',
    predicate: 'http://example.org/name',
    object: '"John Doe"'
  },
  {
    subject: 'http://example.org/john',
    predicate: 'http://example.org/age',
    object: '"30"'
  }
];

export const invalidTriples = [
  {
    subject: 'not-a-uri',
    predicate: 'http://example.org/name',
    object: '"John"'
  }
];
```

### Utility Functions

```typescript
// __tests__/utils/helpers.ts
export async function populateGraph(
  manager: GraphManager,
  triples: Triple[]
): Promise<void> {
  await Promise.all(
    triples.map(triple => manager.addTriple(triple))
  );
}

export function generateTriples(count: number): Triple[] {
  return Array.from({ length: count }, (_, i) => ({
    subject: `http://example.org/item${i}`,
    predicate: 'http://example.org/index',
    object: `"${i}"`
  }));
}
```

## Test Coverage

### Coverage Requirements

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View detailed report
open coverage/lcov-report/index.html
```

### Excluding Files

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ]
};
```

## Performance Testing

### Load Tests

```typescript
describe('Performance', () => {
  it('should handle bulk operations', async () => {
    const count = 10000;
    const triples = generateTriples(count);

    const startTime = Date.now();
    await manager.addTriples(triples);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
```

### Memory Tests

```typescript
describe('Memory Usage', () => {
  it('should not leak memory', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform operations
    for (let i = 0; i < 1000; i++) {
      await manager.addTriple({
        subject: `http://example.org/item${i}`,
        predicate: 'http://example.org/index',
        object: `"${i}"`
      });
    }

    // Clean up
    await manager.clearAll();

    const finalMemory = process.memoryUsage().heapUsed;
    const diff = finalMemory - initialMemory;

    expect(diff).toBeLessThan(1024 * 1024); // 1MB
  });
});
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
```

## Best Practices

1. **Test Organization**
   - Group related tests
   - Use descriptive names
   - Keep tests focused

2. **Test Independence**
   - Clean up after each test
   - Don't share state
   - Use fresh instances

3. **Test Maintenance**
   - Keep tests simple
   - Avoid test duplication
   - Document complex scenarios

## See Also

- [Development Setup](./development-setup.md)
- [Contributing Guidelines](./contributing.md)
- [Architecture](./architecture.md)
- [Release Process](./releasing.md)