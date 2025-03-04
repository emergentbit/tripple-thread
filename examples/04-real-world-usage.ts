import { GraphManager } from '../src';

/**
 * This example demonstrates how to use the library to build a movie knowledge graph.
 * It shows common patterns for:
 * - Organizing data in named graphs
 * - Using consistent URI patterns
 * - Working with different types of relationships
 * - Querying complex relationships
 */

// URI constants for better maintainability
const URI = {
  BASE: 'http://moviedb.example.org',
  MOVIE: 'http://moviedb.example.org/movie',
  PERSON: 'http://moviedb.example.org/person',
  GENRE: 'http://moviedb.example.org/genre',
  PRED: 'http://moviedb.example.org/pred'
};

// Helper function to create movie URIs
const movieUri = (id: string) => `${URI.MOVIE}/${id}`;
const personUri = (id: string) => `${URI.PERSON}/${id}`;
const genreUri = (id: string) => `${URI.GENRE}/${id}`;
const predicate = (name: string) => `${URI.PRED}/${name}`;

async function movieDatabaseExample() {
  const graphManager = new GraphManager({
    dbPath: 'movie_db.sqlite',
    enableBackup: true,
    backupPath: './backups',
    maxConnections: 5
  });

  try {
    // Initialize the database
    await graphManager.init();

    // Example 1: Setting up the movie database structure
    console.log('Example 1: Setting up movie database');
    console.log('----------------------------------');

    // Import genre definitions
    const genreData = `
      @prefix genre: <${URI.GENRE}/> .
      @prefix pred: <${URI.PRED}/> .

      genre:action pred:name "Action" ;
                  pred:description "Action-packed entertainment" .

      genre:scifi  pred:name "Science Fiction" ;
                  pred:description "Futuristic and scientific themes" .

      genre:drama  pred:name "Drama" ;
                  pred:description "Character and plot driven stories" .
    `;

    await graphManager.importFromTurtle(genreData, 'genres');

    // Example 2: Adding a movie with all its relationships
    console.log('\nExample 2: Adding a complete movie entry');
    console.log('-------------------------------------');

    // Add movie details
    const inceptionId = 'inception-2010';
    graphManager.addTriple({
      subject: movieUri(inceptionId),
      predicate: predicate('title'),
      object: '"Inception"'
    }, 'movies');

    graphManager.addTriple({
      subject: movieUri(inceptionId),
      predicate: predicate('releaseYear'),
      object: '"2010"'
    }, 'movies');

    graphManager.addTriple({
      subject: movieUri(inceptionId),
      predicate: predicate('genre'),
      object: genreUri('scifi')
    }, 'movies');

    // Add director
    const nolanId = 'christopher-nolan';
    graphManager.addTriple({
      subject: personUri(nolanId),
      predicate: predicate('name'),
      object: '"Christopher Nolan"'
    }, 'people');

    graphManager.addTriple({
      subject: movieUri(inceptionId),
      predicate: predicate('director'),
      object: personUri(nolanId)
    }, 'movies');

    // Add cast members
    const castData = `
      @prefix movie: <${URI.MOVIE}/> .
      @prefix person: <${URI.PERSON}/> .
      @prefix pred: <${URI.PRED}/> .

      person:leonardo-dicaprio pred:name "Leonardo DiCaprio" .
      person:ellen-page pred:name "Ellen Page" .
      person:joseph-gordon-levitt pred:name "Joseph Gordon-Levitt" .

      movie:${inceptionId} pred:actor person:leonardo-dicaprio ;
                          pred:actor person:ellen-page ;
                          pred:actor person:joseph-gordon-levitt .
    `;

    await graphManager.importFromTurtle(castData, 'people');

    // Example 3: Complex queries
    console.log('\nExample 3: Running complex queries');
    console.log('--------------------------------');

    // Find all actors in the movie
    const actors = graphManager.query(
      movieUri(inceptionId),
      predicate('actor'),
      undefined,
      'movies'
    );

    console.log('Inception actors:', actors);

    // Get movie genre information
    const movieGenre = graphManager.query(
      movieUri(inceptionId),
      predicate('genre'),
      undefined,
      'movies'
    )[0];

    const genreInfo = graphManager.query(
      movieGenre.object,
      undefined,
      undefined,
      'genres'
    );

    console.log('\nMovie genre information:', genreInfo);

    // Example 4: Adding another movie by the same director
    console.log('\nExample 4: Adding related content');
    console.log('-------------------------------');

    const interstellarData = `
      @prefix movie: <${URI.MOVIE}/> .
      @prefix person: <${URI.PERSON}/> .
      @prefix genre: <${URI.GENRE}/> .
      @prefix pred: <${URI.PRED}/> .

      movie:interstellar-2014 pred:title "Interstellar" ;
                             pred:releaseYear "2014" ;
                             pred:director person:${nolanId} ;
                             pred:genre genre:scifi .

      person:matthew-mcconaughey pred:name "Matthew McConaughey" .
      person:anne-hathaway pred:name "Anne Hathaway" .

      movie:interstellar-2014 pred:actor person:matthew-mcconaughey ;
                             pred:actor person:anne-hathaway .
    `;

    await graphManager.importFromTurtle(interstellarData, 'movies');

    // Example 5: Finding connections
    console.log('\nExample 5: Finding connections between entities');
    console.log('-------------------------------------------');

    // Find all movies by Christopher Nolan
    const nolanMovies = graphManager.query(
      undefined,
      predicate('director'),
      personUri(nolanId),
      'movies'
    );

    console.log('Movies directed by Christopher Nolan:', nolanMovies);

    // Find all sci-fi movies
    const scifiMovies = graphManager.query(
      undefined,
      predicate('genre'),
      genreUri('scifi'),
      'movies'
    );

    console.log('\nAll sci-fi movies:', scifiMovies);

    // Export the entire movie database
    console.log('\nComplete movie database in Turtle format:');
    console.log('\nMovies graph:');
    console.log(await graphManager.exportToTurtle('movies'));
    console.log('\nPeople graph:');
    console.log(await graphManager.exportToTurtle('people'));
    console.log('\nGenres graph:');
    console.log(await graphManager.exportToTurtle('genres'));

  } finally {
    graphManager.close();
  }
}

// Run the example
movieDatabaseExample().catch(console.error);