# Core Concepts

This guide explains the core concepts of Triple Thread and how they work together.

## RDF Triples

### Basic Structure

An RDF triple consists of three components:
- **Subject**: The entity being described (must be a URI)
- **Predicate**: The property or relationship (must be a URI)
- **Object**: The value or related entity (can be a URI or literal)

Example:
```typescript
const triple = {
  subject: 'http://example.org/john',
  predicate: 'http://example.org/name',
  object: '"John Doe"'
};
```

### URI Format

URIs must follow RFC 3986 format. The library validates URIs using a strict regex pattern:
```typescript
const URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:[^\s]*$/;
```

### Literal Values

Literals represent string values and can include:
- Plain literals: `"John Doe"`
- Language-tagged literals: `"John Doe"@en`
- Datatype literals: `"42"^^<http://www.w3.org/2001/XMLSchema#integer>`

The library validates literals using this pattern:
```typescript
const LITERAL_REGEX = /^"[^"\\]*(?:\\.[^"\\]*)*"(?:@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*|\^\^<[^>]+>)?$/;
```

## Named Graphs

### Graph Organization

Named graphs allow you to organize triples into separate collections:
```typescript
// Add to specific graph
await graphManager.addTriple(triple, 'people');

// Query from specific graph
const results = await graphManager.query(
  subject,
  predicate,
  object,
  'people'
);
```

### Default Graph

If no graph is specified, triples are stored in the 'default' graph:
```typescript
// These are equivalent:
await graphManager.addTriple(triple);
await graphManager.addTriple(triple, 'default');
```

## Soft Deletion

### Deletion Flag

Triples can be marked for soft deletion using the `_delete` flag:
```typescript
const triple = {
  subject: 'http://example.org/john',
  predicate: 'http://example.org/name',
  object: '"John Doe"',
  _delete: true  // Mark for deletion
};
```

### Recovery

Soft-deleted triples can be recovered by setting `_delete` to false or removing the flag.

## Database Storage

### Storage Options

Two storage modes are available:
1. **File-based**: Persistent storage in SQLite file
   ```typescript
   const graphManager = new GraphManager({
     dbPath: './data.sqlite'
   });
   ```

2. **In-memory**: Temporary storage (good for testing)
   ```typescript
   const graphManager = new GraphManager({
     dbPath: ':memory:'
   });
   ```

### Backup System

Automatic backup features:
```typescript
const graphManager = new GraphManager({
  enableBackup: true,
  backupPath: './backups',
  backupConfig: {
    interval: 3600000,  // Backup interval (ms)
    maxBackups: 24      // Maximum backups to keep
  }
});
```

## Validation

### Triple Validation

The library validates:
1. URI syntax for subjects and predicates
2. URI or literal syntax for objects
3. Graph names (if provided)
4. Deletion flag type (if provided)

### Error Handling

Validation errors throw `ValidationError`:
```typescript
try {
  await graphManager.addTriple({
    subject: 'invalid',  // Invalid URI
    predicate: 'http://example.org/name',
    object: '"John"'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  }
}
```

## Query System

### Basic Queries

Query parameters are optional, allowing flexible searches:
```typescript
// All triples about John
const results = await graphManager.query(
  'http://example.org/john'
);

// All name predicates
const names = await graphManager.query(
  undefined,
  'http://example.org/name'
);
```

### Graph-Specific Queries

Queries can target specific graphs:
```typescript
const results = await graphManager.query(
  subject,
  predicate,
  object,
  'my-graph'
);
```

## Transaction Management

### Batch Operations

Multiple operations are wrapped in transactions:
```typescript
await graphManager.addTriples([
  triple1,
  triple2,
  triple3
]);
```

### Error Handling

Transactions automatically roll back on error:
```typescript
try {
  await graphManager.addTriples(triples);
} catch (error) {
  // All changes are rolled back
  console.error('Transaction failed:', error);
}
```

## Resource Management

### Connection Lifecycle

Always initialize and close properly:
```typescript
const graphManager = new GraphManager(options);
await graphManager.init();  // Required before use

try {
  // Use the graph manager
} finally {
  await graphManager.close();  // Clean up resources
}
```

### Connection Pooling

Configure maximum concurrent connections:
```typescript
const graphManager = new GraphManager({
  maxConnections: 5  // Limit concurrent connections
});
```

## Next Steps

- See [Examples](./examples.md) for practical usage
- Check [API Reference](./api-reference.md) for detailed documentation
- Review [Best Practices](./best-practices.md) for optimization tips
- Read [FAQ](./faq.md) for common questions