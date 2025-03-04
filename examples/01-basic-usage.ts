import { GraphManager } from '../src';

async function basicUsageExample() {
  // Create a new GraphManager instance
  // Using an in-memory database for this example
  const graphManager = new GraphManager({
    dbPath: ':memory:'
  });

  try {
    // Initialize the database
    await graphManager.init();

    // Example 1: Adding individual triples
    console.log('Example 1: Adding and querying individual triples');
    console.log('----------------------------------------------');

    // Add information about a person
    await graphManager.addTriple({
      subject: 'http://example.org/john',
      predicate: 'http://example.org/name',
      object: '"John Doe"'  // Literal values are wrapped in quotes
    });

    await graphManager.addTriple({
      subject: 'http://example.org/john',
      predicate: 'http://example.org/age',
      object: '"30"'
    });

    // Query all triples about John
    const johnTriples = await graphManager.query('http://example.org/john');
    console.log('All triples about John:', johnTriples);
    console.log();

    // Example 2: Working with RDF Turtle format
    console.log('Example 2: Importing and exporting Turtle data');
    console.log('-------------------------------------------');

    // Import data about multiple people using Turtle format
    const turtleData = `
      @prefix ex: <http://example.org/> .
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .

      ex:jane
        foaf:name "Jane Smith" ;
        foaf:age "28" ;
        foaf:knows ex:john .

      ex:bob
        foaf:name "Bob Wilson" ;
        foaf:age "35" ;
        foaf:knows ex:jane .
    `;

    // Import the Turtle data
    await graphManager.importFromTurtle(turtleData);

    // Query all triples about Jane
    const janeTriples = graphManager.query('http://example.org/jane');
    console.log('All triples about Jane:', janeTriples);
    console.log();

    // Example 3: Querying with different patterns
    console.log('Example 3: Advanced querying');
    console.log('-------------------------');

    // Find all "knows" relationships
    const knowsTriples = graphManager.query(
      undefined,  // any subject
      'http://xmlns.com/foaf/0.1/knows',  // "knows" predicate
      undefined  // any object
    );
    console.log('All "knows" relationships:', knowsTriples);
    console.log();

    // Example 4: Exporting data
    console.log('Example 4: Exporting all data as Turtle');
    console.log('-----------------------------------');

    // Export all data in Turtle format
    const exportedTurtle = await graphManager.exportToTurtle();
    console.log(exportedTurtle);

  } finally {
    // Always close the database connection when done
    graphManager.close();
  }
}

// Run the example
basicUsageExample().catch(console.error);