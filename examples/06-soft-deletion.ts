import { GraphManager } from '../src';
import { DatabaseManager } from '../src/db/DatabaseManager';
import { Triple } from '../src/types/Triple';

/**
 * This example demonstrates how to:
 * - Mark triples for soft deletion
 * - Query including/excluding deleted triples
 * - Recover soft-deleted triples
 * - Work with soft deletion in different graphs
 */

async function softDeletionExample() {
  let db: DatabaseManager | null = null;
  let graph: GraphManager | null = null;

  try {
    // Initialize with in-memory database
    db = new DatabaseManager({ dbPath: ':memory:' });
    graph = new GraphManager(db);
    await graph.init();

    if (!graph) {
      throw new Error('Failed to initialize graph manager');
    }

    console.log('Example 1: Adding and soft-deleting triples');
    console.log('----------------------------------------');

    // Add some initial data
    await graph.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/name',
      object: '"Alice"'
    });

    await graph.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/email',
      object: '"alice@example.org"'
    });

    // Query initial state
    const initialQuery = `
      SELECT ?p ?o
      WHERE {
        <http://example.org/person1> ?p ?o
      }
    `;
    let results = await graph.query(initialQuery);
    console.log('Initial data:', results);

    // Mark email for deletion
    await graph.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/email',
      object: '"alice@example.org"',
      _delete: true  // Mark for soft deletion
    });

    // Query after soft deletion
    const afterDeletionQuery = `
      SELECT ?p ?o
      WHERE {
        <http://example.org/person1> ?p ?o
      }
    `;
    results = await graph.query(afterDeletionQuery);
    console.log('\nAfter soft deletion:', results);

    console.log('\nExample 2: Recovering soft-deleted triples');
    console.log('---------------------------------------');

    // Recover the deleted email
    await graph.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/email',
      object: '"alice@example.org"',
      _delete: false  // Unmark for deletion
    });

    // Query after recovery
    const afterRecoveryQuery = `
      SELECT ?p ?o
      WHERE {
        <http://example.org/person1> ?p ?o
      }
    `;
    results = await graph.query(afterRecoveryQuery);
    console.log('After recovery:', results);

    console.log('\nExample 3: Soft deletion in named graphs');
    console.log('-------------------------------------');

    // Add data to a specific graph
    await graph.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/phone',
      object: '"+1-555-0123"'
    }, 'contact-info');

    // Query the specific graph
    const contactInfoQuery = `
      SELECT ?p ?o
      WHERE {
        <http://example.org/person1> ?p ?o
      }
      FROM contact-info
    `;
    results = await graph.query(contactInfoQuery);
    console.log('Contact info graph before deletion:', results);

    // Soft delete in specific graph
    await graph.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/phone',
      object: '"+1-555-0123"',
      _delete: true
    }, 'contact-info');

    // Query after deletion
    results = await graph.query(contactInfoQuery);
    console.log('\nContact info graph after deletion:', results);

    console.log('\nExample 4: Batch soft deletion');
    console.log('----------------------------');

    // Add multiple triples
    const triples: Triple[] = [
      {
        subject: 'http://example.org/person1',
        predicate: 'http://example.org/address',
        object: '"123 Main St"'
      },
      {
        subject: 'http://example.org/person1',
        predicate: 'http://example.org/city',
        object: '"Springfield"'
      }
    ];

    await graph.addTriples(triples, 'address-info');

    // Query before batch deletion
    const addressInfoQuery = `
      SELECT ?p ?o
      WHERE {
        <http://example.org/person1> ?p ?o
      }
      FROM address-info
    `;
    results = await graph.query(addressInfoQuery);
    console.log('Address info before batch deletion:', results);

    // Soft delete all address info
    await graph.addTriples(
      triples.map(t => ({ ...t, _delete: true })),
      'address-info'
    );

    // Query after batch deletion
    results = await graph.query(addressInfoQuery);
    console.log('\nAddress info after batch deletion:', results);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (graph) {
      await graph.close();
    }
  }
}

// Run the example
softDeletionExample().catch(console.error);