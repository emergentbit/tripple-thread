# Tripple Thread

A TypeScript library for managing RDF semantic graphs using SQLite storage. This library provides a simple and efficient way to work with RDF data, supporting operations like importing, exporting, querying, and managing triples across multiple named graphs.

## Features

- 💾 **SQLite Storage**: Persistent storage of RDF triples using SQLite
- 📊 **Named Graphs**: Support for multiple named graphs within the same database
- 🔄 **RDF Format Support**: Import and export RDF data in Turtle format
- 🔍 **Flexible Querying**: Query triples by subject, predicate, object, or any combination
- 🎯 **Type Safety**: Full TypeScript support with comprehensive type definitions
- ✨ **High Performance**: Optimized SQLite indexes for fast querying
- 🔒 **Connection Pooling**: Efficient connection management for concurrent operations
- 💾 **Backup & Restore**: Automated backup functionality with restore capabilities
- 🧪 **Well Tested**: Comprehensive test coverage with Jest

## Installation

```bash
npm install @emergentbit/tripple-thread
```

## Quick Start

```typescript
import { GraphManager } from '@emergentbit/tripple-thread';

// Initialize the graph manager
const graph = new GraphManager({ dbPath: 'mydb.sqlite' });
await graph.init();

// Add a triple
await graph.addTriple({
  subject: 'http://example.org/john',
  predicate: 'http://example.org/name',
  object: '"John Doe"',
  graph: 'people'  // Optional graph name
});

// Query triples
const results = await graph.query(
  'http://example.org/john',  // subject
  undefined,                  // any predicate
  undefined,                  // any object
  'people'                   // graph name
);

// Close when done
await graph.close();
```

## Detailed Usage

### Working with Named Graphs

```typescript
// Add triple to a specific graph
await graph.addTriple({
  subject: 'http://example.org/john',
  predicate: 'http://example.org/name',
  object: '"John Doe"'
}, 'people');

// Import Turtle data
const turtle = `
  @prefix ex: <http://example.org/> .
  ex:jane ex:name "Jane Smith" .
  ex:jane ex:age "28"^^<http://www.w3.org/2001/XMLSchema#integer> .
`;
await graph.importFromTurtle(turtle, 'people');

// Query all triples in a graph
const allPeople = await graph.query(
  undefined,
  undefined,
  undefined,
  'people'
);

// Export graph to Turtle
const exported = await graph.exportToTurtle('people');
```

### Backup and Restore

```typescript
// Enable backup with options
const graph = new GraphManager({
  dbPath: 'mydb.sqlite',
  enableBackup: true,
  backupPath: './backups'
});

// Create backup
await graph.backup();

// Restore from backup
await graph.restoreFromBackup('./backups/mydb_20240304.sqlite');
```

### Connection Pooling

```typescript
// Configure connection pool
const graph = new GraphManager({
  dbPath: 'mydb.sqlite',
  maxConnections: 5  // Default is 10
});

// Connections are automatically managed
const promises = Array(10).fill(0).map(() =>
  graph.query(undefined, undefined, undefined)
);
await Promise.all(promises);  // Concurrent queries are handled efficiently
```

## API Reference

### GraphManager

#### Constructor Options
```typescript
interface GraphManagerOptions {
  dbPath?: string;           // Path to SQLite database (default: ':memory:')
  enableBackup?: boolean;    // Enable automated backups
  backupPath?: string;       // Path for backup files
  maxConnections?: number;   // Max concurrent connections (default: 10)
}
```

#### Core Methods

- `async init(): Promise<void>` - Initialize database and tables
- `async close(): Promise<void>` - Close all connections

#### Triple Operations

- `async addTriple(triple: Triple, graph?: string): Promise<void>`
- `async deleteTriple(triple: Triple, graph?: string): Promise<void>`
- `async query(subject?: string, predicate?: string, object?: string, graph?: string): Promise<Triple[]>`

#### Graph Operations

- `async queryGraphs(): Promise<string[]>` - List all graphs
- `async importFromTurtle(data: string, graph?: string): Promise<void>`
- `async exportToTurtle(graph?: string): Promise<string>`

#### Backup Operations

- `async backup(): Promise<void>`
- `async restoreFromBackup(path: string): Promise<void>`

### Triple Interface

```typescript
interface Triple {
  subject: string;    // URI of the subject
  predicate: string;  // URI of the predicate
  object: string;     // URI or literal value
  graph?: string;     // Optional graph name
}
```

## Error Handling

The library uses custom error types for better error handling:

```typescript
try {
  await graph.addTriple({
    subject: 'invalid',
    predicate: 'http://example.org/name',
    object: '"John"'
  });
} catch (error) {
  if (error instanceof DatabaseError) {
    // Handle database-specific errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  }
}
```

## Best Practices

1. **Connection Management**
   - Always call `close()` when done with the GraphManager
   - Use connection pooling for concurrent operations
   - Consider using a try-finally block

2. **Data Validation**
   - URIs should be valid and properly formatted
   - Literal values should be properly quoted
   - Use appropriate datatype annotations for typed literals

3. **Performance**
   - Use specific queries instead of broad ones when possible
   - Batch operations for bulk imports
   - Consider using named graphs to partition data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- GitHub Issues: [tripple-thread/issues](https://github.com/emergentbit/tripple-thread/issues)
- Email: krispy@emergentbit.com

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Uses [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) for SQLite operations
- RDF parsing powered by [rdf-parse](https://github.com/rubensworks/rdf-parse.js)