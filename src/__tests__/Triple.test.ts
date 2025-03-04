import { Triple, ValidationError, isValidLiteral, isValidUri, validateTriple } from '../types/Triple';

describe('Triple Interface and Validation', () => {
  describe('isValidUri', () => {
    it('should validate correct URIs', () => {
      const validUris = [
        'http://example.org/resource',
        'https://example.com/path#fragment',
        'urn:isbn:0-486-27557-4',
        'file:///path/to/file'
      ];

      validUris.forEach(uri => {
        expect(isValidUri(uri)).toBe(true);
      });
    });

    it('should reject invalid URIs', () => {
      const invalidUris = [
        'not a uri',
        'http:/missing-slashes',
        ' http://spaces.com',
        ''
      ];

      invalidUris.forEach(uri => {
        console.log(`Testing URI: "${uri}"`);
        console.log(`Result: ${isValidUri(uri)}`);
        expect(isValidUri(uri)).toBe(false);
      });
    });
  });

  describe('isValidLiteral', () => {
    it('should validate simple literals', () => {
      expect(isValidLiteral('"Simple literal"')).toBe(true);
    });

    it('should validate literals with language tags', () => {
      expect(isValidLiteral('"Hello"@en')).toBe(true);
      expect(isValidLiteral('"Bonjour"@fr-FR')).toBe(true);
    });

    it('should validate literals with datatypes', () => {
      expect(isValidLiteral('"42"^^<http://www.w3.org/2001/XMLSchema#integer>')).toBe(true);
      expect(isValidLiteral('"true"^^<http://www.w3.org/2001/XMLSchema#boolean>')).toBe(true);
    });

    it('should reject invalid literals', () => {
      const invalidLiterals = [
        'not a literal',
        '"unclosed literal',
        '"wrong@language"',
        '"invalid^^datatype"',
        ''
      ];

      invalidLiterals.forEach(literal => {
        console.log(`Testing literal: "${literal}"`);
        const result = isValidLiteral(literal);
        console.log(`Result: ${result}`);
        expect(isValidLiteral(literal)).toBe(false);
      });
    });
  });

  describe('validateTriple', () => {
    it('should accept valid triples without graph', () => {
      const triple: Triple = {
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      };

      expect(() => validateTriple(triple)).not.toThrow();
    });

    it('should accept valid triples with graph', () => {
      const triple: Triple = {
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object',
        graph: 'http://example.org/graph'
      };

      expect(() => validateTriple(triple)).not.toThrow();
    });

    it('should accept triples with literal objects', () => {
      const triple: Triple = {
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: '"42"^^<http://www.w3.org/2001/XMLSchema#integer>'
      };

      expect(() => validateTriple(triple)).not.toThrow();
    });

    it('should reject triples with invalid subject', () => {
      const triple: Triple = {
        subject: 'invalid subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      };

      expect(() => validateTriple(triple)).toThrow(ValidationError);
    });

    it('should reject triples with invalid predicate', () => {
      const triple: Triple = {
        subject: 'http://example.org/subject',
        predicate: 'invalid predicate',
        object: 'http://example.org/object'
      };

      expect(() => validateTriple(triple)).toThrow(ValidationError);
    });

    it('should reject triples with invalid object', () => {
      const triple: Triple = {
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'invalid object'
      };

      expect(() => validateTriple(triple)).toThrow(ValidationError);
    });
  });
});