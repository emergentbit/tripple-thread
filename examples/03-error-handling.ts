import { GraphManager } from '../src';
import { DatabaseManager } from '../src/db/DatabaseManager';

/**
 * Error Handling Example
 *
 * This example demonstrates how to handle various error scenarios
 * when working with the Tripple Thread library.
 */

async function errorHandlingExample() {
  let db: DatabaseManager | null = null;
  let graph: GraphManager | null = null;

  try {
    // Example 1: Handle initialization errors
    console.log('Example 1: Handling initialization errors');
    console.log('----------------------------------------');

    try {
      // Try to initialize with an invalid database path
      db = new DatabaseManager({ dbPath: '/invalid/path/db.sqlite' });
      graph = new GraphManager(db);
      await graph.init();
    } catch (error) {
      console.error('Failed to initialize database:', error.message);

      // Fallback to in-memory database
      console.log('\nFalling back to in-memory database...');
      db = new DatabaseManager({ dbPath: ':memory:' });
      graph = new GraphManager(db);
      await graph.init();
    }

    if (!graph) {
      throw new Error('Failed to initialize graph manager');
    }
    const safeGraph: GraphManager = graph;

    // Example 2: Handle validation errors
    console.log('\nExample 2: Handling validation errors');
    console.log('------------------------------------');

    if (!graph) {
      throw new Error('Graph manager is not initialized');
    }

    try {
      // Try to add a triple with invalid URIs
      await graph.addTriple({
        subject: 'invalid-uri',  // Missing http:// scheme
        predicate: 'name',       // Missing http:// scheme
        object: 'John'          // Not a proper literal or URI
      });
    } catch (error) {
      console.error('Validation error:', error.message);

      // Add the triple with correct URI format
      await graph.addTriple({
        subject: 'http://example.org/person/john',
        predicate: 'http://example.org/name',
        object: '"John"'
      });
    }

    // Example 3: Handle query errors
    console.log('\nExample 3: Handling query errors');
    console.log('--------------------------------');

    if (!graph) {
      throw new Error('Graph manager is not initialized');
    }

    try {
      // Try to query from a non-existent graph
      const results = await graph.query('non-existent-graph');
      console.log('Results:', results);
    } catch (error) {
      console.error('Query error:', error.message);
    }

    // Example 4: Handle backup errors
    console.log('\nExample 4: Handling backup errors');
    console.log('--------------------------------');

    if (!graph) {
      throw new Error('Graph manager is not initialized');
    }

    try {
      // Try to backup without enabling backup functionality
      await graph.backup();
    } catch (error) {
      console.error('Backup error:', error.message);

      // Create a new graph manager with backup enabled
      const dbWithBackup = new DatabaseManager({
        dbPath: ':memory:',
        backup: {
          enabled: true,
          interval: 3600000,  // 1 hour
          maxBackups: 24,     // Keep last 24 backups
          path: './backups'
        }
      });
      const graphWithBackup = new GraphManager(dbWithBackup);
      await graphWithBackup.init();
      await graphWithBackup.backup();
      await graphWithBackup.close();
    }

    // Example 5: Handle concurrent operations
    console.log('\nExample 5: Handling concurrent operations');
    console.log('---------------------------------------');

    if (!graph) {
      throw new Error('Graph manager is not initialized');
    }

    const concurrentBatch = Array(100).fill(null).map((_, i) => ({
      subject: `http://example.org/item${i}`,
      predicate: 'http://schema.org/position',
      object: `"${i}"`
    }));

    try {
      // Try to execute too many concurrent operations
      await Promise.all(
        concurrentBatch.map(triple => safeGraph.addTriple(triple))
      );
    } catch (error) {
      console.error('Concurrent operations error:', error.message);

      // Create a new graph manager with proper connection pool settings
      const dbWithPool = new DatabaseManager({
        dbPath: ':memory:',
        maxConnections: 10  // Limit concurrent connections
      });
      const graphWithPool = new GraphManager(dbWithPool);
      await graphWithPool.init();

      // Process in smaller batches
      const batchSize = 10;
      for (let i = 0; i < concurrentBatch.length; i += batchSize) {
        const currentBatch = concurrentBatch.slice(i, i + batchSize);
        await Promise.all(
          currentBatch.map(triple => graphWithPool.addTriple(triple))
        );
      }

      await graphWithPool.close();
    }

    // Example 6: Handle cleanup errors
    console.log('\nExample 6: Handling cleanup errors');
    console.log('--------------------------------');

    if (!graph) {
      throw new Error('Graph manager is not initialized');
    }

    try {
      // Try to delete a non-existent graph
      await graph.deleteGraph('non-existent-graph');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  } finally {
    // Always try to close the connection, even if there were errors
    if (graph) {
      try {
        await graph.close();
      } catch (error) {
        console.error('Error during cleanup:', error.message);
      }
    }
  }
}

// Run the example
errorHandlingExample().catch(console.error);