import { DatabaseError, GraphError, TripleError } from '../types/Errors';

describe('Error Classes', () => {
  describe('DatabaseError', () => {
    it('should create a DatabaseError with correct name and message', () => {
      const error = new DatabaseError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Test error');
    });
  });

  describe('GraphError', () => {
    it('should create a GraphError with correct name and message', () => {
      const error = new GraphError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GraphError);
      expect(error.name).toBe('GraphError');
      expect(error.message).toBe('Test error');
    });
  });

  describe('TripleError', () => {
    it('should create a TripleError with correct name and message', () => {
      const error = new TripleError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TripleError);
      expect(error.name).toBe('TripleError');
      expect(error.message).toBe('Test error');
    });
  });
});