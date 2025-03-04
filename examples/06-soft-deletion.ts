import { GraphManager } from '../src';

/**
 * This example demonstrates how to:
 * - Mark triples for soft deletion
 * - Query including/excluding deleted triples
 * - Recover soft-deleted triples
 * - Work with soft deletion in different graphs
 */

async function softDeletionExample() {
  const graphManager = new GraphManager({
    dbPath: ':memory:'  // Using in-memory database for example
  });

  try {
    await graphManager.init();

    console.log('Example 1: Adding and soft-deleting triples');
    console.log('----------------------------------------');

    // Add some initial data
    await graphManager.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/name',
      object: '"Alice"'
    });

    await graphManager.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/email',
      object: '"alice@example.org"'
    });

    // Query initial state
    let results = await graphManager.query('http://example.org/person1');
    console.log('Initial data:', results);

    // Mark email for deletion
    await graphManager.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/email',
      object: '"alice@example.org"',
      _delete: true  // Mark for soft deletion
    });

    // Query after soft deletion
    results = await graphManager.query('http://example.org/person1');
    console.log('\nAfter soft deletion:', results);

    console.log('\nExample 2: Recovering soft-deleted triples');
    console.log('---------------------------------------');

    // Recover the deleted email
    await graphManager.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/email',
      object: '"alice@example.org"',
      _delete: false  // Unmark for deletion
    });

    // Query after recovery
    results = await graphManager.query('http://example.org/person1');
    console.log('After recovery:', results);

    console.log('\nExample 3: Soft deletion in named graphs');
    console.log('-------------------------------------');

    // Add data to a specific graph
    await graphManager.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/phone',
      object: '"+1-555-0123"'
    }, 'contact-info');

    // Query the specific graph
    results = await graphManager.query(
      'http://example.org/person1',
      undefined,
      undefined,
      'contact-info'
    );
    console.log('Contact info graph before deletion:', results);

    // Soft delete in specific graph
    await graphManager.addTriple({
      subject: 'http://example.org/person1',
      predicate: 'http://example.org/phone',
      object: '"+1-555-0123"',
      _delete: true
    }, 'contact-info');

    // Query after deletion
    results = await graphManager.query(
      'http://example.org/person1',
      undefined,
      undefined,
      'contact-info'
    );
    console.log('\nContact info graph after deletion:', results);

    console.log('\nExample 4: Batch soft deletion');
    console.log('----------------------------');

    // Add multiple triples
    const triples = [
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

    await graphManager.addTriples(triples, 'address-info');

    // Query before batch deletion
    results = await graphManager.query(
      'http://example.org/person1',
      undefined,
      undefined,
      'address-info'
    );
    console.log('Address info before batch deletion:', results);

    // Soft delete all address info
    await graphManager.addTriples(
      triples.map(t => ({ ...t, _delete: true })),
      'address-info'
    );

    // Query after batch deletion
    results = await graphManager.query(
      'http://example.org/person1',
      undefined,
      undefined,
      'address-info'
    );
    console.log('\nAddress info after batch deletion:', results);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await graphManager.close();
  }
}

// Run the example
softDeletionExample().catch(console.error);