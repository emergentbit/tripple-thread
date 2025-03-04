import { GraphManager } from '../src';

async function errorHandlingExample() {
  let graphManager: GraphManager | undefined;

  try {
    // Example 1: Handling database connection errors
    console.log('Example 1: Database connection error handling');
    console.log('----------------------------------------');

    try {
      // Attempt to connect to a non-existent directory
      graphManager = new GraphManager({
        dbPath: '/non/existent/path/db.sqlite'
      });
      await graphManager.init();
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      // In a real application, you might want to:
      // - Log the error
      // - Notify monitoring systems
      // - Try an alternative database location
    }

    // Create a valid connection for the rest of the examples
    graphManager = new GraphManager({
      dbPath: ':memory:'
    });
    await graphManager.init();

    // Example 2: Handling invalid RDF data
    console.log('\nExample 2: Invalid RDF data handling');
    console.log('----------------------------------');

    const invalidTurtle = `
      This is not valid Turtle format.
      It will cause a parsing error.
    `;

    try {
      await graphManager.importFromTurtle(invalidTurtle);
    } catch (error) {
      console.error('Failed to parse Turtle data:', error.message);
      // In a real application, you might want to:
      // - Log the parsing error
      // - Save the invalid data for inspection
      // - Skip the invalid data and continue with valid data
    }

    // Example 3: Handling invalid triples
    console.log('\nExample 3: Invalid triple handling');
    console.log('--------------------------------');

    try {
      // Attempt to add an invalid triple (missing required fields)
      await graphManager.addTriple({
        subject: '',  // Empty subject is invalid
        predicate: 'http://example.org/name',
        object: '"John"'
      });
    } catch (error) {
      console.error('Failed to add invalid triple:', error.message);
    }

    // Example 4: Transaction-like operations
    console.log('\nExample 4: Handling batch operations');
    console.log('----------------------------------');

    const batchData = [
      {
        subject: 'http://example.org/person1',
        predicate: 'http://example.org/name',
        object: '"Person 1"'
      },
      {
        subject: 'http://example.org/person2',
        predicate: 'http://example.org/name',
        object: '"Person 2"'
      }
    ];

    try {
      // Attempt to add all triples in a batch
      for (const triple of batchData) {
        await graphManager.addTriple(triple);
      }
    } catch (error) {
      console.error('Failed to add batch data:', error.message);
      // In a real application, you might want to:
      // - Roll back previous operations
      // - Skip failed items and continue with others
      // - Log failed operations for retry
    }

    // Example 5: Resource cleanup
    console.log('\nExample 5: Resource cleanup');
    console.log('-------------------------');

    try {
      // Perform some operations that might fail
      const turtle = await graphManager.exportToTurtle();
      console.log('Successfully exported data:', turtle);
    } catch (error) {
      console.error('Operation failed:', error.message);
    } finally {
      // Always clean up resources, even if operations fail
      if (graphManager) {
        try {
          await graphManager.close();
          console.log('Successfully closed database connection');
        } catch (error) {
          console.error('Failed to close database:', error.message);
          // In a real application, you might want to:
          // - Log the error
          // - Force close any remaining connections
          // - Notify system administrators
        }
      }
    }

  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error:', error.message);
    throw error;  // Re-throw if you want to propagate the error
  }
}

// Run the example with proper error handling
errorHandlingExample()
  .catch(error => {
    console.error('Example failed:', error);
    process.exit(1);  // Exit with error code in case of failure
  });