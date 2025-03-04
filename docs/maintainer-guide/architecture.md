# Architecture Guide

This document provides a detailed overview of the Triple Thread library's architecture and design decisions.

## Core Components

### Triple Interface

The foundation of the library is the `Triple` interface, which represents an RDF triple with the following properties:

```typescript
interface Triple {
  subject: string;    // The subject URI
  predicate: string;  // The predicate URI
  object: string;     // The object URI or literal
  graph?: string;     // Optional named graph identifier
  _delete?: boolean;  // Flag for soft deletion
}
```

### Database Management

The `DatabaseManager` class handles all SQLite database operations:

- Uses SQLite3 for persistent storage
- Supports in-memory databases for testing
- Implements automatic backup functionality
- Handles transaction management
- Provides CRUD operations for triples

Key features:
- Promise-based async operations
- Proper error handling with custom `DatabaseError` class
- Automatic schema creation and index management
- Support for named graphs
- Configurable backup system with rotation

### Graph Management

The `GraphManager` class provides high-level operations:

- Triple management (add, query, delete)
- Named graph support
- Turtle format import/export
- Validation of URIs and literals

Configuration options:
```typescript
interface GraphManagerOptions {
  dbPath?: string;
  enableBackup?: boolean;
  backupPath?: string;
  maxConnections?: number;
  backupConfig?: {
    interval: number;    // Backup interval in milliseconds
    maxBackups?: number; // Maximum number of backups to keep
  };
}
```

## Data Storage

### Database Schema

The SQLite database uses a single `triples` table with the following schema:

```sql
CREATE TABLE triples (
  subject TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object TEXT NOT NULL,
  graph TEXT NOT NULL DEFAULT 'default',
  PRIMARY KEY (subject, predicate, object, graph)
);
```

Indexes for optimized querying:
- `idx_subject`: (subject, graph)
- `idx_predicate`: (predicate, graph)
- `idx_object`: (object, graph)
- `idx_graph`: (graph)

### Validation

The library implements strict validation for:

- URI syntax (RFC 3986 compliant)
- RDF literals (including language tags and datatypes)
- Triple integrity
- Graph naming conventions

## Error Handling

Custom error classes:
- `DatabaseError`: Database-related errors
- `ValidationError`: Data validation errors

All operations use try-catch blocks with:
- Specific error messages
- Error type preservation
- Proper cleanup in error cases

## Backup System

Features:
- Configurable backup intervals
- Backup rotation with max limit
- File streaming for efficient backup
- Safe restore operations
- Automatic cleanup of old backups

## Design Decisions

1. **Promise-based API**: All async operations return Promises for better integration with modern JavaScript/TypeScript.

2. **Soft Deletion**: Implemented via `_delete` flag in the Triple interface for data recovery and audit trails.

3. **Named Graphs**: First-class support for named graphs enables better data organization and querying.

4. **SQLite Storage**: Chosen for:
   - Embedded database (no separate server)
   - ACID compliance
   - Wide platform support
   - Simple backup/restore

5. **Strict Validation**: Ensures data integrity and RDF compliance.

## Performance Considerations

1. **Indexing Strategy**:
   - Composite indexes for common query patterns
   - Balance between query performance and storage overhead

2. **Transaction Management**:
   - Batch operations use transactions
   - Automatic rollback on errors

3. **Memory Usage**:
   - Streaming for large operations
   - Configurable connection pooling
   - Optional in-memory database for testing

## Future Considerations

Potential areas for enhancement:

1. **Query Optimization**:
   - Prepared statements caching
   - Query plan optimization
   - Additional indexes based on usage patterns

2. **Scalability**:
   - Sharding support
   - Distributed graph support
   - Replication options

3. **Feature Additions**:
   - SPARQL query support
   - Additional RDF serialization formats
   - Graph merging and diffing
   - Full-text search capabilities

4. **Monitoring**:
   - Performance metrics
   - Query logging
   - Health checks
   - Usage statistics

## Dependencies

Core dependencies:
- `sqlite3`: Database engine
- Node.js built-in modules (`fs`, `path`)

No external RDF libraries are used; all RDF processing is handled internally for better control and reduced dependencies.