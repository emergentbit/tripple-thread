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

// Initialize with in-memory database for quick testing
const graph = new GraphManager();
await graph.init();

// Define common prefixes
const ex = 'http://example.org/';
const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
const schema = 'http://schema.org/';

// Add some triples about a person
await graph.addTriple({
  subject: `${ex}john`,
  predicate: `${rdf}type`,
  object: `${schema}Person`
});

await graph.addTriple({
  subject: `${ex}john`,
  predicate: `${schema}name`,
  object: '"John Doe"'
});

await graph.addTriple({
  subject: `${ex}john`,
  predicate: `${schema}email`,
  object: '"john@example.org"'
});

// Query all information about John
const results = await graph.query(
  `${ex}john`,  // subject
  undefined,    // any predicate
  undefined     // any object
);

console.log(results);
// Close when done
await graph.close();
```

## Detailed Usage

### Working with Named Graphs

```typescript
import { GraphManager } from '@emergentbit/tripple-thread';

const graph = new GraphManager({ dbPath: 'knowledge-base.sqlite' });
await graph.init();

// Add organization data to a specific graph
const orgGraph = 'http://example.org/graphs/organizations';

// Import organization data using Turtle format
const orgData = `
@prefix org: <http://example.org/org/> .
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

org:emergentbit rdf:type schema:Organization ;
    schema:name "EmergentBit" ;
    schema:url "https://emergentbit.com" ;
    schema:employee org:john .

org:john rdf:type schema:Person ;
    schema:name "John Doe" ;
    schema:jobTitle "Software Engineer" ;
    schema:email "john@emergentbit.com" .
`;

await graph.importFromTurtle(orgData, orgGraph);

// Query all employees
const employees = await graph.query(
  undefined,                          // any subject
  'http://schema.org/employee',       // predicate
  undefined,                          // any object
  orgGraph                           // from org graph
);

// Export the entire organization graph
const exportedTurtle = await graph.exportToTurtle(orgGraph);
```

### Working with Multiple Graphs

```typescript
// Add data to different graphs for better organization
const peopleGraph = 'http://example.org/graphs/people';
const projectsGraph = 'http://example.org/graphs/projects';

// Add person data
await graph.addTriple({
  subject: 'http://example.org/jane',
  predicate: 'http://schema.org/name',
  object: '"Jane Smith"',
  graph: peopleGraph
});

// Add project data
await graph.addTriple({
  subject: 'http://example.org/project1',
  predicate: 'http://schema.org/name',
  object: '"Project Alpha"',
  graph: projectsGraph
});

// Link person to project
await graph.addTriple({
  subject: 'http://example.org/project1',
  predicate: 'http://schema.org/member',
  object: 'http://example.org/jane',
  graph: projectsGraph
});

// List all available graphs
const graphs = await graph.queryGraphs();
console.log('Available graphs:', graphs);

// Query across multiple graphs
const janeData = await Promise.all([
  graph.query('http://example.org/jane', undefined, undefined, peopleGraph),
  graph.query(undefined, 'http://schema.org/member', 'http://example.org/jane', projectsGraph)
]);
```

### Backup and Restore

```typescript
// Initialize with backup enabled
const graph = new GraphManager({
  dbPath: 'production.sqlite',
  enableBackup: true,
  backupPath: './backups',
  maxConnections: 5
});

try {
  await graph.init();

  // Perform some operations
  await graph.addTriple({
    subject: 'http://example.org/product1',
    predicate: 'http://schema.org/name',
    object: '"Amazing Product"'
  });

  // Create timestamped backup
  await graph.backup();

} catch (error) {
  console.error('Error:', error);

  // Restore from most recent backup if needed
  const backupFile = './backups/production_20240304_120000.sqlite';
  await graph.restoreFromBackup(backupFile);

} finally {
  await graph.close();
}
```

### Connection Pooling and Concurrent Operations

```typescript
// Initialize with connection pool settings
const graph = new GraphManager({
  dbPath: 'concurrent.sqlite',
  maxConnections: 10
});

await graph.init();

try {
  // Prepare batch of operations
  const batch = Array(20).fill(null).map((_, i) => ({
    subject: `http://example.org/item${i}`,
    predicate: 'http://schema.org/position',
    object: `"${i}"`
  }));

  // Execute concurrent operations
  await Promise.all(
    batch.map(triple => graph.addTriple(triple))
  );

  // Perform concurrent queries
  const results = await Promise.all([
    graph.query(undefined, 'http://schema.org/position', undefined),
    graph.query('http://example.org/item1', undefined, undefined),
    graph.query(undefined, undefined, '"10"')
  ]);

} finally {
  await graph.close();
}
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