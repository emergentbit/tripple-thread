# API Reference

## GraphManager

The main class for managing RDF triples and graphs.

### Constructor

```typescript
constructor(options: GraphManagerOptions)
```

Options:
```typescript
interface GraphManagerOptions {
  dbPath?: string;            // Path to SQLite file or ':memory:'
  enableBackup?: boolean;     // Enable automatic backups
  backupPath?: string;        // Directory for backup files
  maxConnections?: number;    // Maximum concurrent connections
  backupConfig?: {
    interval: number;         // Backup interval in milliseconds
    maxBackups?: number;      // Maximum number of backups to keep
  };
}
```

### Methods

#### init()
```typescript
async init(): Promise<void>
```
Initializes the database and creates necessary tables and indexes. Must be called before using other methods.

#### addTriple()
```typescript
async addTriple(triple: Triple, graph: string = 'default'): Promise<void>
```
Adds a single triple to the specified graph.

Parameters:
- `triple`: The triple to add
- `graph`: Optional graph name (defaults to 'default')

#### addTriples()
```typescript
async addTriples(triples: Triple[], graph: string = 'default'): Promise<void>
```
Adds multiple triples in a single transaction.

Parameters:
- `triples`: Array of triples to add
- `graph`: Optional graph name (defaults to 'default')

#### query()
```typescript
async query(
  subject?: string,
  predicate?: string,
  object?: string,
  graph: string = 'default'
): Promise<Triple[]>
```
Queries triples matching the specified pattern.

Parameters:
- `subject`: Optional subject URI to match
- `predicate`: Optional predicate URI to match
- `object`: Optional object (URI or literal) to match
- `graph`: Optional graph name (defaults to 'default')

#### importFromTurtle()
```typescript
async importFromTurtle(data: string, graph: string = 'default'): Promise<void>
```
Imports triples from Turtle format text.

Parameters:
- `data`: Turtle format string
- `graph`: Optional graph name (defaults to 'default')

#### exportToTurtle()
```typescript
async exportToTurtle(graph: string = 'default'): Promise<string>
```
Exports triples from the specified graph to Turtle format.

Parameters:
- `graph`: Optional graph name (defaults to 'default')

#### backup()
```typescript
async backup(): Promise<void>
```
Manually triggers a database backup. Only works if backup is enabled in options.

#### restoreFromBackup()
```typescript
async restoreFromBackup(backupPath: string): Promise<void>
```
Restores the database from a backup file.

Parameters:
- `backupPath`: Path to the backup file

#### deleteGraph()
```typescript
async deleteGraph(graph: string): Promise<void>
```
Deletes all triples in the specified graph.

Parameters:
- `graph`: Name of the graph to delete

#### clearAll()
```typescript
async clearAll(): Promise<void>
```
Deletes all triples from all graphs.

#### close()
```typescript
async close(): Promise<void>
```
Closes the database connection and cleans up resources.

## Types

### Triple
```typescript
interface Triple {
  subject: string;     // URI of the subject
  predicate: string;   // URI of the predicate
  object: string;      // URI or literal value
  graph?: string;      // Optional graph name
  _delete?: boolean;   // Optional deletion flag
}
```

### ValidationError
```typescript
class ValidationError extends Error {
  constructor(message: string);
}
```
Thrown when triple validation fails.

### DatabaseError
```typescript
class DatabaseError extends Error {
  constructor(message: string);
}
```
Thrown when database operations fail.

## Validation Functions

### isValidUri()
```typescript
function isValidUri(uri: string): boolean
```
Checks if a string is a valid URI according to RFC 3986.

Parameters:
- `uri`: String to validate

### isValidLiteral()
```typescript
function isValidLiteral(literal: string): boolean
```
Checks if a string is a valid RDF literal.

Parameters:
- `literal`: String to validate

### validateTriple()
```typescript
function validateTriple(triple: Triple): void
```
Validates a triple's subject, predicate, and object.

Parameters:
- `triple`: Triple to validate

Throws:
- `ValidationError` if validation fails

## Constants

### URI_REGEX
```typescript
const URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:[^\s]*$/;
```
Regular expression for validating URIs.

### LITERAL_REGEX
```typescript
const LITERAL_REGEX = /^"[^"\\]*(?:\\.[^"\\]*)*"(?:@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*|\^\^<[^>]+>)?$/;
```
Regular expression for validating literals.

## Error Handling

All async methods can throw:
- `ValidationError`: When input validation fails
- `DatabaseError`: When database operations fail
- `Error`: For other unexpected errors

Example:
```typescript
try {
  await graphManager.addTriple(triple);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

1. Always call `init()` before using other methods
2. Use `try/finally` to ensure `close()` is called
3. Use transactions (`addTriples()`) for bulk operations
4. Enable backups for production use
5. Configure appropriate connection limits
6. Handle all potential errors
7. Validate input before calling methods

## See Also

- [Getting Started](./getting-started.md)
- [Core Concepts](./concepts.md)
- [Examples](./examples.md)
- [Best Practices](./best-practices.md)
- [FAQ](./faq.md)