import { GraphManager } from '../src';
import { DatabaseManager } from '../src/db/DatabaseManager';

/**
 * Named Graphs Example
 *
 * This example demonstrates how to work with named graphs in the Tripple Thread library.
 * Named graphs allow you to organize and partition your RDF data into separate contexts.
 */

async function namedGraphsExample() {
  // Initialize with in-memory database for quick testing
  const db = new DatabaseManager({ dbPath: ':memory:' });
  const graph = new GraphManager(db);

  try {
    await graph.init();

    // Define common prefixes for cleaner code
    const ex = 'http://example.org/';
    const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    const schema = 'http://schema.org/';
    const org = 'http://example.org/organization#';

    // Add organization data to a specific graph
    const orgGraph = 'organization';
    await graph.addTriples([
      {
        subject: `${org}company`,
        predicate: `${rdf}type`,
        object: `${schema}Organization`
      },
      {
        subject: `${org}company`,
        predicate: `${schema}name`,
        object: '"Acme Corporation"'
      },
      {
        subject: `${org}company`,
        predicate: `${schema}foundingDate`,
        object: '"2000-01-01"^^<http://www.w3.org/2001/XMLSchema#date>'
      }
    ], orgGraph);

    // Add employee data to a different graph
    const employeeGraph = 'employees';
    await graph.addTriples([
      {
        subject: `${ex}alice`,
        predicate: `${rdf}type`,
        object: `${schema}Person`
      },
      {
        subject: `${ex}alice`,
        predicate: `${schema}name`,
        object: '"Alice Smith"'
      },
      {
        subject: `${ex}alice`,
        predicate: `${schema}worksFor`,
        object: `${org}company`
      },
      {
        subject: `${ex}bob`,
        predicate: `${rdf}type`,
        object: `${schema}Person`
      },
      {
        subject: `${ex}bob`,
        predicate: `${schema}name`,
        object: '"Bob Jones"'
      },
      {
        subject: `${ex}bob`,
        predicate: `${schema}worksFor`,
        object: `${org}company`
      }
    ], employeeGraph);

    // Add project data to another graph
    const projectGraph = 'projects';
    await graph.addTriples([
      {
        subject: `${ex}project1`,
        predicate: `${rdf}type`,
        object: `${schema}Project`
      },
      {
        subject: `${ex}project1`,
        predicate: `${schema}name`,
        object: '"Project Alpha"'
      },
      {
        subject: `${ex}project1`,
        predicate: `${schema}member`,
        object: `${ex}alice`
      },
      {
        subject: `${ex}project2`,
        predicate: `${rdf}type`,
        object: `${schema}Project`
      },
      {
        subject: `${ex}project2`,
        predicate: `${schema}name`,
        object: '"Project Beta"'
      },
      {
        subject: `${ex}project2`,
        predicate: `${schema}member`,
        object: `${ex}bob`
      }
    ], projectGraph);

    // Query and display data from different graphs
    console.log('\nOrganization Data:');
    const orgData = await graph.query(orgGraph);
    console.log(orgData);

    console.log('\nEmployee Data:');
    const employeeData = await graph.query(employeeGraph);
    console.log(employeeData);

    console.log('\nProject Data:');
    const projectData = await graph.query(projectGraph);
    console.log(projectData);

    // List all available graphs
    console.log('\nAvailable Graphs:');
    const graphs = await graph.queryGraphs();
    console.log(graphs);

    // Export data from each graph as Turtle
    for (const graphName of graphs) {
      console.log(`\nData in graph '${graphName}' as Turtle:`);
      const turtle = await graph.exportToTurtle(graphName);
      console.log(turtle);
    }

    // Delete a specific graph
    console.log('\nDeleting project graph...');
    await graph.deleteGraph(projectGraph);

    // Verify the graph was deleted
    const remainingGraphs = await graph.queryGraphs();
    console.log('\nRemaining graphs:', remainingGraphs);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await graph.close();
  }
}

// Run the example
namedGraphsExample().catch(console.error);