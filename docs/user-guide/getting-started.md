# Getting Started with Triple Thread

This guide will help you get started with Triple Thread, a TypeScript library for managing RDF triples with SQLite storage.

## Installation

```bash
npm install triple-thread
```

## Basic Usage

```typescript
import { GraphManager } from 'triple-thread';

async function example() {
  // Create a new GraphManager instance
  const graphManager = new GraphManager({
    dbPath: 'my-database.sqlite',  // Use ':memory:' for in-memory database
    enableBackup: true,            // Enable automatic backups
    backupPath: './backups',       // Where to store backups
    maxConnections: 5,             // Maximum concurrent connections
    backupConfig: {
      interval: 3600000,           // Backup every hour (in milliseconds)
      maxBackups: 24              // Keep last 24 backups
    }
  });

  // Initialize the database
  await graphManager.init();

  try {
    // Add a triple
    await graphManager.addTriple({
      subject: 'http://example.org/john',
      predicate: 'http://example.org/name',
      object: '"John Doe"'
    });

    // Query triples
    const results = await graphManager.query(
      'http://example.org/john',  // subject
      undefined,                  // any predicate
      undefined                   // any object
    );

    console.log('Query results:', results);

  } finally {
    // Always close the connection when done
    await graphManager.close();
  }
}

example().catch(console.error);
```

## Key Features

- **SQLite Storage**: Persistent or in-memory storage
- **Named Graphs**: Organize triples in different graphs
- **Backup System**: Automatic backups with rotation
- **Validation**: URI and literal validation
- **Turtle Format**: Import/export RDF data in Turtle format
- **Soft Deletion**: Support for marking triples as deleted
- **Promise-based API**: Modern async/await interface
- **Type Safety**: Full TypeScript support

## Core Concepts

### Triples

A triple consists of:
```typescript
interface Triple {
  subject: string;    // URI of the subject
  predicate: string;  // URI of the predicate
  object: string;     // URI or literal value
  graph?: string;     // Optional named graph
  _delete?: boolean;  // Optional deletion flag
}
```

### Named Graphs

Organize your data in different graphs:
```typescript
// Add triple to specific graph
await graphManager.addTriple(triple, 'my-graph');

// Query from specific graph
const results = await graphManager.query(
  subject,
  predicate,
  object,
  'my-graph'
);
```

### Backup System

Configure automatic backups:
```typescript
const graphManager = new GraphManager({
  enableBackup: true,
  backupPath: './backups',
  backupConfig: {
    interval: 3600000,  // 1 hour
    maxBackups: 24      // Keep last 24 backups
  }
});
```

## Next Steps

- Check out the [Examples](./examples.md) for more usage scenarios
- Learn about [Core Concepts](./concepts.md)
- Read the [API Reference](./api-reference.md)
- Follow [Best Practices](./best-practices.md)
- See [FAQ](./faq.md) for common questions

## Prerequisites

- Node.js (v14 or higher)
- SQLite support on your system

## Configuration

The library requires no additional configuration beyond specifying the database path when creating a new `GraphManager` instance.

### Database Options

- Use `:memory:` for an in-memory database (useful for testing)
- Use a file path for persistent storage

```typescript
// In-memory database
const tempGraph = new GraphManager(':memory:');

// File-based database
const persistentGraph = new GraphManager('./data/my-graph.sqlite');
```

## Common Issues

1. **Database Permissions**: Ensure write permissions for the database directory
2. **Memory Usage**: For large datasets, use file-based storage instead of in-memory
3. **Resource Cleanup**: Always close the graph manager when done

## Support

If you encounter issues:
1. Check the [Troubleshooting](./troubleshooting.md) guide
2. Search existing GitHub issues
3. Create a new issue if needed