import { GraphManager } from '../src';
import { DatabaseManager } from '../src/db/DatabaseManager';

/**
 * Basic Usage Example
 *
 * This example demonstrates the basic usage of the Tripple Thread library,
 * including initialization, adding triples, and querying data.
 */

async function basicExample() {
  // Initialize with in-memory database for quick testing
  const db = new DatabaseManager({ dbPath: ':memory:' });
  const graph = new GraphManager(db);

  try {
    await graph.init();

    // Define common prefixes for cleaner code
    const ex = 'http://example.org/';
    const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
    const schema = 'http://schema.org/';
    const foaf = 'http://xmlns.com/foaf/0.1/';

    // Add basic information about a person
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

    // Add more detailed information
    await graph.addTriple({
      subject: `${ex}john`,
      predicate: `${schema}jobTitle`,
      object: '"Software Engineer"'
    });

    await graph.addTriple({
      subject: `${ex}john`,
      predicate: `${schema}birthDate`,
      object: '"1990-01-01"^^<http://www.w3.org/2001/XMLSchema#date>'
    });

    // Add social connections
    await graph.addTriple({
      subject: `${ex}john`,
      predicate: `${foaf}knows`,
      object: `${ex}jane`
    });

    // Query all information about John
    console.log('\nAll information about John:');
    const allTriples = await graph.query();
    const johnInfo = allTriples.filter(triple => triple.subject === `${ex}john`);
    console.log(johnInfo);

    // Query by type
    console.log('\nAll Persons:');
    const persons = allTriples.filter(triple =>
      triple.predicate === `${rdf}type` &&
      triple.object === `${schema}Person`
    );
    console.log(persons);

    // Query social connections
    console.log('\nPeople John knows:');
    const connections = allTriples.filter(triple =>
      triple.subject === `${ex}john` &&
      triple.predicate === `${foaf}knows`
    );
    console.log(connections);

    // Export all data as Turtle
    console.log('\nAll data as Turtle:');
    const turtle = await graph.exportToTurtle();
    console.log(turtle);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await graph.close();
  }
}

// Run the example
basicExample().catch(console.error);