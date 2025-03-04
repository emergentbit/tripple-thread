# Examples

This guide provides practical examples of using Tripple Thread in various scenarios.

## Basic Usage

### Creating and Managing Triples

```typescript
import { GraphManager, Triple } from 'tripple-thread';

async function basicExample() {
  const manager = new GraphManager();

  try {
    // Create some triples
    const triples: Triple[] = [
      {
        subject: 'http://example.org/john',
        predicate: 'http://example.org/name',
        object: '"John Doe"'
      },
      {
        subject: 'http://example.org/john',
        predicate: 'http://example.org/age',
        object: '"30"'
      },
      {
        subject: 'http://example.org/john',
        predicate: 'http://example.org/email',
        object: '"john@example.org"'
      }
    ];

    // Add triples in a single transaction
    await manager.addTriples(triples);

    // Query all facts about John
    const facts = await manager.query('http://example.org/john');
    console.log('Facts about John:', facts);

    // Export to Turtle format
    const turtle = await manager.exportToTurtle();
    console.log('Turtle format:', turtle);
  } finally {
    await manager.close();
  }
}
```

## Working with Named Graphs

### Managing Multiple Datasets

```typescript
async function namedGraphsExample() {
  const manager = new GraphManager();

  try {
    // Add data to different graphs
    await manager.addTriple({
      subject: 'http://example.org/alice',
      predicate: 'http://example.org/department',
      object: '"Engineering"'
    }, 'employees');

    await manager.addTriple({
      subject: 'http://example.org/project1',
      predicate: 'http://example.org/lead',
      object: 'http://example.org/alice'
    }, 'projects');

    // Query specific graphs
    const employeeData = await manager.query(
      undefined,
      undefined,
      undefined,
      'employees'
    );

    const projectData = await manager.query(
      undefined,
      undefined,
      undefined,
      'projects'
    );

    // List all graphs
    const graphs = await manager.queryGraphs();
    console.log('Available graphs:', graphs);

    // Delete a specific graph
    await manager.deleteGraph('projects');
  } finally {
    await manager.close();
  }
}
```

## Error Handling

### Handling Common Errors

```typescript
async function errorHandlingExample() {
  const manager = new GraphManager();

  try {
    try {
      // Invalid URI format
      await manager.addTriple({
        subject: 'invalid-uri',
        predicate: 'http://example.org/name',
        object: '"John"'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('Validation error:', error.message);
      }
    }

    try {
      // Invalid database path
      const invalidManager = new GraphManager({
        dbPath: '/invalid/path/db.sqlite'
      });
      await invalidManager.addTriple({
        subject: 'http://example.org/test',
        predicate: 'http://example.org/value',
        object: '"test"'
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        console.error('Database error:', error.message);
      }
    }
  } finally {
    await manager.close();
  }
}
```

## Real-World Use Cases

### Knowledge Base Management

```typescript
async function knowledgeBaseExample() {
  const manager = new GraphManager({
    dbPath: 'knowledge_base.sqlite'
  });

  try {
    // Define some knowledge about books and authors
    const bookData = [
      {
        subject: 'http://example.org/book1',
        predicate: 'http://example.org/title',
        object: '"1984"'
      },
      {
        subject: 'http://example.org/book1',
        predicate: 'http://example.org/author',
        object: 'http://example.org/george_orwell'
      },
      {
        subject: 'http://example.org/george_orwell',
        predicate: 'http://example.org/name',
        object: '"George Orwell"'
      }
    ];

    // Add to 'books' graph
    await manager.addTriples(bookData, 'books');

    // Query all books by George Orwell
    const orwellBooks = await manager.query(
      undefined,
      'http://example.org/author',
      'http://example.org/george_orwell',
      'books'
    );

    // Export the books graph
    const booksData = await manager.exportToTurtle('books');
  } finally {
    await manager.close();
  }
}
```

### Data Integration

```typescript
async function dataIntegrationExample() {
  const manager = new GraphManager();

  try {
    // Import data from different sources
    const sourceATurtle = `
      @prefix ex: <http://example.org/> .
      ex:product1 ex:name "Widget" ;
                  ex:price "9.99" .
    `;

    const sourceBTurtle = `
      @prefix ex: <http://example.org/> .
      ex:product1 ex:stock "50" ;
                  ex:category "Tools" .
    `;

    // Import to separate graphs
    await manager.importFromTurtle(sourceATurtle, 'source_a');
    await manager.importFromTurtle(sourceBTurtle, 'source_b');

    // Query combined product information
    const productInfo = await manager.query(
      'http://example.org/product1',
      undefined,
      undefined
    );

    // Export combined data
    const combinedData = await manager.exportToTurtle();
  } finally {
    await manager.close();
  }
}
```

## Best Practices Examples

### Resource Management

```typescript
async function resourceManagementExample() {
  let manager: GraphManager | null = null;

  try {
    manager = new GraphManager();

    // Perform operations
    await manager.addTriple({
      subject: 'http://example.org/resource1',
      predicate: 'http://example.org/status',
      object: '"active"'
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Always close the manager
    if (manager) {
      await manager.close();
    }
  }
}
```

### Bulk Operations

```typescript
async function bulkOperationsExample() {
  const manager = new GraphManager();

  try {
    // Generate many triples
    const triples = Array.from({ length: 1000 }, (_, i) => ({
      subject: `http://example.org/item${i}`,
      predicate: 'http://example.org/index',
      object: `"${i}"`
    }));

    // Add in bulk (single transaction)
    console.time('bulk-insert');
    await manager.addTriples(triples);
    console.timeEnd('bulk-insert');

    // Query in batches
    const batchSize = 100;
    for (let i = 0; i < triples.length; i += batchSize) {
      const batch = await manager.query(
        undefined,
        'http://example.org/index',
        undefined
      );
      // Process batch...
    }
  } finally {
    await manager.close();
  }
}
```

## See Also

- [API Reference](./api-reference.md) for detailed method documentation
- [Basic Concepts](./concepts.md) for understanding RDF concepts
- [Best Practices](./best-practices.md) for production use