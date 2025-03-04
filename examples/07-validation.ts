import { GraphManager, ValidationError, isValidLiteral, isValidUri } from '../src';

/**
 * This example demonstrates:
 * - URI validation
 * - Literal value validation
 * - Triple validation
 * - Error handling for invalid data
 */

async function validationExample() {
  const graphManager = new GraphManager({
    dbPath: ':memory:'
  });

  try {
    await graphManager.init();

    console.log('Example 1: URI Validation');
    console.log('----------------------');

    // Valid URIs
    const validURIs = [
      'http://example.org/resource',
      'urn:isbn:0-486-27557-4',
      'file:///path/to/file.txt'
    ];

    // Invalid URIs
    const invalidURIs = [
      'not a uri',
      'http:/invalid',
      '://no-scheme',
      ' http://spaces.com'
    ];

    console.log('Testing URI validation:');
    for (const uri of validURIs) {
      console.log(`"${uri}" is valid:`, isValidUri(uri));
    }

    console.log('\nTesting invalid URIs:');
    for (const uri of invalidURIs) {
      console.log(`"${uri}" is valid:`, isValidUri(uri));
    }

    console.log('\nExample 2: Literal Validation');
    console.log('---------------------------');

    // Valid literals
    const validLiterals = [
      '"Simple string"',
      '"String with language"@en',
      '"42"^^<http://www.w3.org/2001/XMLSchema#integer>',
      '"Multi\nline\nstring"',
      '"String with \"quotes\""'
    ];

    // Invalid literals
    const invalidLiterals = [
      'No quotes',
      '"Unclosed string',
      '"@invalid-language',
      '"Bad datatype"^^<invalid>',
      'Just "quoted"'
    ];

    console.log('Testing literal validation:');
    for (const literal of validLiterals) {
      console.log(`"${literal}" is valid:`, isValidLiteral(literal));
    }

    console.log('\nTesting invalid literals:');
    for (const literal of invalidLiterals) {
      console.log(`"${literal}" is valid:`, isValidLiteral(literal));
    }

    console.log('\nExample 3: Triple Validation');
    console.log('-------------------------');

    // Try adding valid triple
    try {
      await graphManager.addTriple({
        subject: 'http://example.org/book',
        predicate: 'http://example.org/title',
        object: '"The Book"'
      });
      console.log('Valid triple added successfully');
    } catch (error) {
      console.error('Unexpected error with valid triple:', error.message);
    }

    // Try adding triple with invalid subject
    try {
      await graphManager.addTriple({
        subject: 'not a uri',
        predicate: 'http://example.org/title',
        object: '"The Book"'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('Caught invalid subject:', error.message);
      }
    }

    // Try adding triple with invalid predicate
    try {
      await graphManager.addTriple({
        subject: 'http://example.org/book',
        predicate: 'invalid predicate',
        object: '"The Book"'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('Caught invalid predicate:', error.message);
      }
    }

    // Try adding triple with invalid object
    try {
      await graphManager.addTriple({
        subject: 'http://example.org/book',
        predicate: 'http://example.org/title',
        object: 'not a proper literal or uri'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('Caught invalid object:', error.message);
      }
    }

    console.log('\nExample 4: Batch Validation');
    console.log('-------------------------');

    const mixedTriples = [
      {
        // Valid triple
        subject: 'http://example.org/person',
        predicate: 'http://example.org/name',
        object: '"John"'
      },
      {
        // Invalid subject
        subject: 'invalid',
        predicate: 'http://example.org/name',
        object: '"Jane"'
      }
    ];

    try {
      await graphManager.addTriples(mixedTriples);
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('Batch operation failed:', error.message);
        console.log('No triples were added (transaction rolled back)');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await graphManager.close();
  }
}

// Run the example
validationExample().catch(console.error);