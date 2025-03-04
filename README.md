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
- 🧪 **Well Tested**: 100% test coverage with comprehensive unit tests

## Installation

```bash
npm install tripple-thread
```

## Usage

### Basic Example

```typescript
import { GraphManager } from 'tripple-thread';

// Initialize the graph manager with options
const graphManager = new GraphManager({
  dbPath: 'semantic.db',
  enableBackup: true,
  backupPath: './backups',
  maxConnections: 5
});

// Initialize the database
await graphManager.init();

// Add some triples
await graphManager.addTriple({
  subject: 'http://example.org/john',
  predicate: 'http://example.org/name',
  object: '"John Doe"',
  graph: 'people'  // Optional graph name
});

// Import Turtle data
const turtleData = `
  @prefix ex: <http://example.org/> .
  ex:jane ex:name "Jane Smith" .
  ex:jane ex:age "28"^^<http://www.w3.org/2001/XMLSchema#integer> .
`;

await graphManager.importFromTurtle(turtleData, 'people');

// Query triples from a specific graph
const johnTriples = await graphManager.query('http://example.org/john', undefined, undefined, 'people');
console.log('All triples about John:', johnTriples);

// Export specific graph to Turtle format
const peopleGraph = await graphManager.exportToTurtle('people');
console.log('People graph as Turtle:', peopleGraph);

// Create a backup
await graphManager.backup();

// Don't forget to close the connection when done
await graphManager.close();
```

### Working with Named Graphs

```typescript
// Add triple to a specific graph
await graphManager.addTriple(
  {
    subject: 'http://example.org/john',
    predicate: 'http://example.org/name',
    object: '"John Doe"'
  },
  'people-graph'
);

// Import Turtle data into a specific graph
await graphManager.importFromTurtle(turtleData, 'people-graph');

// Query from a specific graph
const peopleTriples = await graphManager.query(
  undefined,
  undefined,
  undefined,
  'people-graph'
);

// Export a specific graph
const peopleGraph = await graphManager.exportToTurtle('people-graph');
```

## API Reference

### GraphManager

#### Constructor Options
```typescript
interface GraphManagerOptions {
  dbPath?: string;           // Path to SQLite database file (default: ':memory:')
  enableBackup?: boolean;    // Enable automated backups
  backupPath?: string;       // Path to store backup files
  maxConnections?: number;   // Maximum number of concurrent connections
}
```

#### Methods

##### `async init(): Promise<void>`
Initializes the database connection and creates necessary tables.

##### `async addTriple(triple: Triple, graph?: string): Promise<void>`
Adds a triple to the specified graph (defaults to 'default' graph).

##### `async deleteTriple(triple: Triple, graph?: string): Promise<void>`
Deletes a triple from the specified graph.

##### `async query(subject?: string, predicate?: string, object?: string, graph?: string): Promise<Triple[]>`
Queries triples matching the specified criteria from the optional graph.

##### `async queryGraphs(): Promise<string[]>`
Returns a list of all graph names in the database.

##### `async importFromTurtle(turtleData: string, graph?: string): Promise<void>`
Imports RDF data in Turtle format into the specified graph.

##### `async exportToTurtle(graph?: string): Promise<string>`
Exports the specified graph as Turtle format.

##### `async backup(): Promise<void>`
Creates a backup of the database if backup is enabled.

##### `async restoreFromBackup(backupPath: string): Promise<void>`
Restores the database from a backup file.

##### `async close(): Promise<void>`
Closes the database connection.

### Triple Interface

```typescript
interface Triple {
  subject: string;    // URI of the subject
  predicate: string;  // URI of the predicate
  object: string;     // URI or literal value
  graph?: string;     // Optional graph name
}
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tripple-thread.git
cd tripple-thread
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Watch mode for development:
```bash
npm run test:watch
```

## Project Structure

```
tripple-thread/
├── src/
│   ├── db/
│   │   └── DatabaseManager.ts   # SQLite database operations
│   ├── graph/
│   │   └── GraphManager.ts      # RDF graph operations
│   ├── types/
│   │   └── Triple.ts           # Type definitions
│   └── index.ts                # Main entry point
├── __tests__/
│   ├── DatabaseManager.test.ts  # Database tests
│   └── GraphManager.test.ts     # Graph operation tests
└── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.