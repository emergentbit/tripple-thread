import { GraphManager } from '../src';

async function namedGraphsExample() {
  // Create a new GraphManager instance
  const graphManager = new GraphManager({
    dbPath: ':memory:'
  });

  try {
    // Initialize the database
    await graphManager.init();

    // Example 1: Adding data to different graphs
    console.log('Example 1: Adding data to different graphs');
    console.log('---------------------------------------');

    // Add data about movies to a "movies" graph
    await graphManager.addTriple(
      {
        subject: 'http://example.org/movie/inception',
        predicate: 'http://example.org/title',
        object: '"Inception"'
      },
      'movies'  // Specify the graph name
    );

    await graphManager.addTriple(
      {
        subject: 'http://example.org/movie/inception',
        predicate: 'http://example.org/director',
        object: 'http://example.org/person/nolan'
      },
      'movies'
    );

    // Add data about people to a "people" graph
    await graphManager.addTriple(
      {
        subject: 'http://example.org/person/nolan',
        predicate: 'http://example.org/name',
        object: '"Christopher Nolan"'
      },
      'people'
    );

    // Example 2: Importing data into specific graphs
    console.log('\nExample 2: Importing Turtle data into specific graphs');
    console.log('------------------------------------------------');

    // Import more movie data
    const movieData = `
      @prefix movie: <http://example.org/movie/> .
      @prefix pred: <http://example.org/> .

      movie:inception pred:releaseYear "2010" ;
                     pred:genre "Science Fiction" .

      movie:interstellar pred:title "Interstellar" ;
                        pred:releaseYear "2014" ;
                        pred:director <http://example.org/person/nolan> .
    `;

    // Import more people data
    const peopleData = `
      @prefix person: <http://example.org/person/> .
      @prefix pred: <http://example.org/> .

      person:nolan pred:birthYear "1970" ;
                  pred:nationality "British" .
    `;

    // Import data into their respective graphs
    await graphManager.importFromTurtle(movieData, 'movies');
    await graphManager.importFromTurtle(peopleData, 'people');

    // Example 3: Querying specific graphs
    console.log('\nExample 3: Querying specific graphs');
    console.log('--------------------------------');

    // Query all movies directed by Nolan
    const nolanMovies = await graphManager.query(
      undefined,
      'http://example.org/director',
      'http://example.org/person/nolan',
      'movies'  // Only search in the movies graph
    );
    console.log('Movies directed by Nolan:', nolanMovies);

    // Query information about Nolan from the people graph
    const nolanInfo = await graphManager.query(
      'http://example.org/person/nolan',
      undefined,
      undefined,
      'people'  // Only search in the people graph
    );
    console.log('\nInformation about Nolan:', nolanInfo);

    // Example 4: Exporting specific graphs
    console.log('\nExample 4: Exporting specific graphs');
    console.log('--------------------------------');

    console.log('\nMovies graph:');
    console.log(await graphManager.exportToTurtle('movies'));

    console.log('\nPeople graph:');
    console.log(await graphManager.exportToTurtle('people'));

    // Example 5: Deleting from specific graphs
    console.log('\nExample 5: Deleting from specific graphs');
    console.log('------------------------------------');

    // Delete a movie from the movies graph
    await graphManager.query(
      'http://example.org/movie/inception',
      'http://example.org/title',
      '"Inception"',
      'movies'
    ).then(triples => {
      if (triples.length > 0) {
        return graphManager.addTriple({
          ...triples[0],
          _delete: true
        }, 'movies');
      }
    });

    console.log('\nMovies graph after deletion:');
    console.log(await graphManager.exportToTurtle('movies'));

  } finally {
    // Always close the database connection when done
    await graphManager.close();
  }
}

// Run the example
namedGraphsExample().catch(console.error);