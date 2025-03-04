# Frequently Asked Questions

## Data Modeling

### Q: Can this library support predicates that reference other subjects?

Yes, the library fully supports predicates that reference other subjects - this is a core feature of RDF! In RDF, an object can be either a literal value (like a string or number) or a URI reference to another subject.

Example:
```typescript
const manager = new GraphManager();

// Define some people
await manager.addTriples([
  {
    subject: 'http://example.org/john',
    predicate: 'http://example.org/name',
    object: '"John Doe"'  // Literal value (note the quotes)
  },
  {
    subject: 'http://example.org/jane',
    predicate: 'http://example.org/name',
    object: '"Jane Smith"'  // Literal value
  },
  {
    subject: 'http://example.org/john',
    predicate: 'http://example.org/knows',
    object: 'http://example.org/jane'  // Reference to another subject (no quotes)
  }
]);

// Query relationships
const johnsConnections = await manager.query(
  'http://example.org/john',
  'http://example.org/knows'
);
```

### Q: How do I handle different data types in literals?

The library follows RDF literal formatting conventions. Literals are always wrapped in quotes, and you can optionally specify a datatype:

```typescript
// Different data types
await manager.addTriples([
  {
    subject: 'http://example.org/person1',
    predicate: 'http://example.org/age',
    object: '"30"^^<http://www.w3.org/2001/XMLSchema#integer>'
  },
  {
    subject: 'http://example.org/person1',
    predicate: 'http://example.org/height',
    object: '"1.75"^^<http://www.w3.org/2001/XMLSchema#decimal>'
  },
  {
    subject: 'http://example.org/person1',
    predicate: 'http://example.org/active',
    object: '"true"^^<http://www.w3.org/2001/XMLSchema#boolean>'
  }
]);
```

### Q: How do I handle language tags in literals?

You can add language tags to string literals using the `@` suffix:

```typescript
await manager.addTriples([
  {
    subject: 'http://example.org/book1',
    predicate: 'http://example.org/title',
    object: '"The Little Prince"@en'
  },
  {
    subject: 'http://example.org/book1',
    predicate: 'http://example.org/title',
    object: '"Le Petit Prince"@fr'
  }
]);
```

## Performance

### Q: How does the library handle large datasets?

The library uses several strategies for efficient handling of large datasets:

1. **Batch Operations**:
```typescript
// Efficient bulk loading
const largeDataset = generateTriples(100000);
await manager.addTriples(largeDataset); // Single transaction
```

2. **Optimized Indexes**:
```typescript
// Queries use appropriate indexes automatically
const results = await manager.query(
  'http://example.org/subject',  // Uses subject index
  undefined,
  undefined
);
```

3. **Memory Management**:
```typescript
// Process results in chunks
const batchSize = 1000;
for (let i = 0; i < results.length; i += batchSize) {
  const batch = results.slice(i, i + batchSize);
  await processBatch(batch);
}
```

### Q: What's the recommended way to handle concurrent access?

SQLite handles concurrent reads well but has limitations with concurrent writes. For web applications:

1. **Connection Pooling**:
```typescript
class GraphPool {
  private pool: GraphManager[] = [];

  async getManager(): Promise<GraphManager> {
    // Implement connection pooling
  }

  async releaseManager(manager: GraphManager): Promise<void> {
    // Return to pool
  }
}
```

2. **Write Queuing**:
```typescript
class WriteQueue {
  private queue: Promise<void> = Promise.resolve();

  async enqueue(operation: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(operation);
    return this.queue;
  }
}
```

## Error Handling

### Q: How should I handle validation errors?

The library provides specific error types for different scenarios:

```typescript
try {
  await manager.addTriple({
    subject: 'invalid-uri',
    predicate: 'http://example.org/prop',
    object: '"value"'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid URI format:', error.message);
  } else if (error instanceof DatabaseError) {
    console.error('Database operation failed:', error.message);
  }
}
```

### Q: What happens if the database file is corrupted?

The library includes safety measures:

```typescript
// Create with backup support
const manager = new GraphManager({
  dbPath: 'data.sqlite',
  backup: {
    enabled: true,
    interval: 3600000, // 1 hour
    path: 'backups/'
  }
});

// Recover from backup
await manager.restoreFromBackup('backups/data_2024_03_15.sqlite');
```

## Named Graphs

### Q: How do I manage data in different graphs?

Named graphs help organize and isolate data:

```typescript
// Add to specific graphs
await manager.addTriple(triple, 'graph1');
await manager.addTriple(triple, 'graph2');

// Query specific graph
const results = await manager.query(
  undefined,
  undefined,
  undefined,
  'graph1'
);

// List all graphs
const graphs = await manager.queryGraphs();

// Delete a graph
await manager.deleteGraph('graph1');
```

### Q: Can I query across multiple graphs?

Yes, you can either query without specifying a graph (queries all graphs) or combine results:

```typescript
// Query all graphs
const allResults = await manager.query(
  'http://example.org/subject'
);

// Query specific graphs and combine
const graphs = ['graph1', 'graph2'];
const combinedResults = [];
for (const graph of graphs) {
  const results = await manager.query(
    'http://example.org/subject',
    undefined,
    undefined,
    graph
  );
  combinedResults.push(...results);
}
```

## Integration

### Q: Can I use this with Express/Node.js web applications?

Yes, here's a basic Express integration:

```typescript
import express from 'express';
import { GraphManager } from 'tripple-thread';

const app = express();
const manager = new GraphManager('data.sqlite');

app.get('/triples', async (req, res) => {
  try {
    const { subject, predicate, object, graph } = req.query;
    const results = await manager.query(
      subject as string,
      predicate as string,
      object as string,
      graph as string
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clean up on shutdown
process.on('SIGTERM', async () => {
  await manager.close();
  process.exit(0);
});
```

### Q: How do I import data from other RDF formats?

While the library natively supports Turtle format, you can use external libraries for other formats:

```typescript
import * as N3 from 'n3';

async function importN3(data: string): Promise<void> {
  const parser = new N3.Parser();
  const triples = parser.parse(data);

  const converted = triples.map(triple => ({
    subject: triple.subject.value,
    predicate: triple.predicate.value,
    object: triple.object.value
  }));

  await manager.addTriples(converted);
}
```

## See Also

- [Basic Concepts](./concepts.md)
- [API Reference](./api-reference.md)
- [Best Practices](./best-practices.md)
- [Examples](./examples.md)