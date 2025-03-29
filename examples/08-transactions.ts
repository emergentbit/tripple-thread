import { GraphManager, Triple } from '../src';
import { DatabaseManager } from '../src/db/DatabaseManager';

/**
 * This example demonstrates:
 * - Transaction handling for batch operations
 * - Error handling and rollbacks
 * - Performance optimization with transactions
 * - Working with large datasets
 */

async function transactionExample() {
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

    console.log('Example 1: Basic Transaction');
    console.log('-------------------------');

    // Create some test data
    const authorData: Triple[] = [
      {
        subject: 'http://example.org/author1',
        predicate: 'http://example.org/name',
        object: '"Jane Austen"'
      },
      {
        subject: 'http://example.org/author1',
        predicate: 'http://example.org/birth',
        object: '"1775"'
      },
      {
        subject: 'http://example.org/author1',
        predicate: 'http://example.org/nationality',
        object: '"British"'
      }
    ];

    // Add all data in a single transaction
    try {
      await graph.addTriples(authorData);
      console.log('Successfully added author data in transaction');

      // Verify the data
      const authorQuery = `
        SELECT ?p ?o
        WHERE {
          <http://example.org/author1> ?p ?o
        }
      `;
      const results = await graph.query(authorQuery);
      console.log('Author data:', results);
    } catch (error) {
      console.error('Transaction failed:', error.message);
    }

    console.log('\nExample 2: Transaction Rollback');
    console.log('-----------------------------');

    // Try to add data with an invalid triple
    const invalidData: Triple[] = [
      {
        subject: 'http://example.org/book1',
        predicate: 'http://example.org/title',
        object: '"Pride and Prejudice"'
      },
      {
        subject: 'invalid-uri',  // This will cause validation to fail
        predicate: 'http://example.org/author',
        object: 'http://example.org/author1'
      }
    ];

    try {
      await graph.addTriples(invalidData);
    } catch (error) {
      console.log('Transaction rolled back:', error.message);

      // Verify no data was added
      const bookQuery = `
        SELECT ?p ?o
        WHERE {
          <http://example.org/book1> ?p ?o
        }
      `;
      const results = await graph.query(bookQuery);
      console.log('No book data after rollback:', results.length === 0);
    }

    console.log('\nExample 3: Large Dataset Performance');
    console.log('--------------------------------');

    // Generate a large dataset
    const generateBookData = (count: number): Triple[] => {
      const books: Triple[] = [];
      for (let i = 0; i < count; i++) {
        books.push({
          subject: `http://example.org/book${i}`,
          predicate: 'http://example.org/title',
          object: `"Book ${i}"`
        }, {
          subject: `http://example.org/book${i}`,
          predicate: 'http://example.org/author',
          object: 'http://example.org/author1'
        });
      }
      return books;
    };

    // Add books one by one (slow)
    console.log('Adding books individually...');
    const startIndividual = Date.now();
    const individualBooks = generateBookData(10);
    for (const book of individualBooks) {
      await graph.addTriple(book);
    }
    console.log(`Time taken individually: ${Date.now() - startIndividual}ms`);

    // Clear the database
    await graph.clearAll();

    // Add books in a single transaction (fast)
    console.log('\nAdding books in transaction...');
    const startBatch = Date.now();
    const batchBooks = generateBookData(10);
    await graph.addTriples(batchBooks);
    console.log(`Time taken in batch: ${Date.now() - startBatch}ms`);

    console.log('\nExample 4: Nested Operations');
    console.log('-------------------------');

    try {
      // Start with author
      await graph.addTriples([{
        subject: 'http://example.org/author2',
        predicate: 'http://example.org/name',
        object: '"Charles Dickens"'
      }] as Triple[]);

      // Add books and relationships
      const bookData: Triple[] = [
        {
          subject: 'http://example.org/book/oliver-twist',
          predicate: 'http://example.org/title',
          object: '"Oliver Twist"'
        },
        {
          subject: 'http://example.org/book/oliver-twist',
          predicate: 'http://example.org/author',
          object: 'http://example.org/author2'
        },
        {
          subject: 'http://example.org/book/oliver-twist',
          predicate: 'http://example.org/year',
          object: '"1837"'
        }
      ];

      await graph.addTriples(bookData);

      // Query the complete data
      const bookQuery = `
        SELECT ?p ?o
        WHERE {
          <http://example.org/book/oliver-twist> ?p ?o
        }
      `;
      const bookResults = await graph.query(bookQuery);
      console.log('Complete book data:', bookResults);

    } catch (error) {
      console.error('Nested operations failed:', error.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (graph) {
      await graph.close();
    }
  }
}

// Run the example
transactionExample().catch(console.error);