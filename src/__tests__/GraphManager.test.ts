import fs from 'fs';
import path from 'path';
import { DatabaseManager } from '../db/DatabaseManager';
import { GraphManager } from '../graph/GraphManager';
import { Triple } from '../types/Triple';

// Mock DatabaseManager
jest.mock('../db/DatabaseManager');

jest.mock('sqlite3', () => ({
  Database: jest.fn()
}));
jest.mock('fs');
jest.mock('path', () => ({
  dirname: jest.fn(),
  join: jest.fn()
}));

describe('GraphManager', () => {
  let mockDb: jest.Mocked<DatabaseManager>;
  let graphManager: GraphManager;

  beforeAll(() => {
    // Setup path mocks
    (path.dirname as jest.Mock).mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Setup fs mocks
    (fs.existsSync as jest.Mock).mockImplementation(() => true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup database mock
    mockDb = new DatabaseManager({ dbPath: ':memory:' }) as jest.Mocked<DatabaseManager>;
    graphManager = new GraphManager(mockDb);
  });

  describe('initialization', () => {
    it('should initialize and setup schema', async () => {
      await graphManager.init();
      expect(mockDb.init).toHaveBeenCalled();
      expect(mockDb.setupSchema).toHaveBeenCalled();
    });

    it('handles initialization error', async () => {
      mockDb.init.mockRejectedValueOnce(new Error('Init failed'));
      await expect(graphManager.init()).rejects.toThrow('Init failed');
    });
  });

  describe('triple operations', () => {
    beforeEach(async () => {
      await graphManager.init();
    });

    it('should add a single triple', async () => {
      const triple: Triple = {
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      };

      await graphManager.addTriple(triple);
      expect(mockDb.addTriple).toHaveBeenCalledWith(triple, 'default');
    });

    it('should add multiple triples', async () => {
      const triples: Triple[] = [{
        subject: 'http://example.org/subject1',
        predicate: 'http://example.org/predicate1',
        object: 'http://example.org/object1'
      }, {
        subject: 'http://example.org/subject2',
        predicate: 'http://example.org/predicate2',
        object: 'http://example.org/object2'
      }];

      await graphManager.addTriples(triples);
      expect(mockDb.addTriples).toHaveBeenCalledWith(triples, 'default');
    });

    it('should query triples from a graph', async () => {
      const mockTriples: Triple[] = [{
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      }];

      mockDb.getTriples.mockResolvedValueOnce(mockTriples);
      const result = await graphManager.query('test-graph');
      expect(mockDb.getTriples).toHaveBeenCalledWith('test-graph');
      expect(result).toEqual(mockTriples);
    });

    it('should delete a graph', async () => {
      await graphManager.deleteGraph('test-graph');
      expect(mockDb.deleteGraph).toHaveBeenCalledWith('test-graph');
    });

    it('should clear all triples', async () => {
      await graphManager.clearAll();
      expect(mockDb.clearAll).toHaveBeenCalled();
    });
  });

  describe('graph operations', () => {
    beforeEach(async () => {
      await graphManager.init();
    });

    it('should query available graphs', async () => {
      const mockTriples: Triple[] = [
        { subject: 's1', predicate: 'p1', object: 'o1', graph: 'graph1' },
        { subject: 's2', predicate: 'p2', object: 'o2', graph: 'graph2' },
        { subject: 's3', predicate: 'p3', object: 'o3', graph: 'graph1' }
      ];

      mockDb.getTriples.mockResolvedValueOnce(mockTriples);
      const graphs = await graphManager.queryGraphs();
      expect(graphs).toEqual(['graph1', 'graph2']);
    });
  });

  describe('importFromTurtle', () => {
    beforeEach(async () => {
      await graphManager.init();
    });

    it('should handle empty or comment-only turtle input', async () => {
      const turtle = `
        # This is a comment

        # Another comment
      `;
      await graphManager.importFromTurtle(turtle);
      expect(mockDb.addTriples).toHaveBeenCalledWith([], 'default');
    });

    it('should handle prefix declarations', async () => {
      const turtle = `
        @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
        @prefix ex: <http://example.org/> .

        <http://example.org/subject> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/Class> .
      `;
      await graphManager.importFromTurtle(turtle);
      expect(mockDb.addTriples).toHaveBeenCalledWith([{
        subject: 'http://example.org/subject',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: 'http://example.org/Class'
      }], 'default');
    });

    it('should handle invalid prefix declarations', async () => {
      const turtle = `
        @prefix invalid
        <http://example.org/subject> <http://example.org/predicate> <http://example.org/object> .
      `;
      await graphManager.importFromTurtle(turtle);
      expect(mockDb.addTriples).toHaveBeenCalledWith([{
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      }], 'default');
    });

    it('should handle different URI formats', async () => {
      const turtle = `
        <http://example.org/subject> <http://example.org/predicate> <http://example.org/object> .
        <http://example.org/subject2> <http://example.org/predicate2> "literal value"^^<http://www.w3.org/2001/XMLSchema#string> .
      `;
      await graphManager.importFromTurtle(turtle);
      expect(mockDb.addTriples).toHaveBeenCalledWith([
        {
          subject: 'http://example.org/subject',
          predicate: 'http://example.org/predicate',
          object: 'http://example.org/object'
        },
        {
          subject: 'http://example.org/subject2',
          predicate: 'http://example.org/predicate2',
          object: '"literal value"^^<http://www.w3.org/2001/XMLSchema#string>'
        }
      ], 'default');
    });

    it('should handle database error', async () => {
      mockDb.addTriples.mockRejectedValueOnce(new Error('Import failed'));
      const turtle = '<http://example.org/subject> <http://example.org/predicate> <http://example.org/object> .';
      await expect(graphManager.importFromTurtle(turtle)).rejects.toThrow('Import failed');
    });
  });

  describe('exportToTurtle', () => {
    beforeEach(async () => {
      await graphManager.init();
    });

    it('should export triples in Turtle format', async () => {
      const mockTriples: Triple[] = [{
        subject: 'http://example.org/subject1',
        predicate: 'http://example.org/predicate1',
        object: 'http://example.org/object1'
      }];

      mockDb.getTriples.mockResolvedValueOnce(mockTriples);

      const turtle = await graphManager.exportToTurtle();
      expect(turtle).toContain('@prefix rdf:');
      expect(turtle).toContain('@prefix rdfs:');
      expect(turtle).toContain('@prefix xsd:');
      expect(turtle).toContain('<http://example.org/subject1>');
      expect(turtle).toContain('<http://example.org/predicate1>');
      expect(turtle).toContain('<http://example.org/object1>');
    });

    it('should handle literal objects', async () => {
      const mockTriples: Triple[] = [{
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: '"literal value"@en'
      }];

      mockDb.getTriples.mockResolvedValueOnce(mockTriples);

      const turtle = await graphManager.exportToTurtle();
      expect(turtle).toContain('"literal value"@en');
    });

    it('should handle empty result', async () => {
      mockDb.getTriples.mockResolvedValueOnce([]);
      const turtle = await graphManager.exportToTurtle();
      expect(turtle).toContain('@prefix');
      expect(turtle.trim().endsWith('.')).toBeTruthy();
    });

    it('should handle database error', async () => {
      mockDb.getTriples.mockRejectedValueOnce(new Error('Export failed'));
      await expect(graphManager.exportToTurtle()).rejects.toThrow('Export failed');
    });

    it('should export from specific graph', async () => {
      const mockTriples: Triple[] = [{
        subject: 'http://example.org/subject1',
        predicate: 'http://example.org/predicate1',
        object: 'http://example.org/object1'
      }];

      mockDb.getTriples.mockResolvedValueOnce(mockTriples);
      await graphManager.exportToTurtle('test-graph');
      expect(mockDb.getTriples).toHaveBeenCalledWith('test-graph');
    });

    it('should group triples by subject', async () => {
      const triples: Triple[] = [
        { subject: 'http://ex.org/s1', predicate: 'http://ex.org/p1', object: 'http://ex.org/o1' },
        { subject: 'http://ex.org/s1', predicate: 'http://ex.org/p2', object: 'http://ex.org/o2' },
        { subject: 'http://ex.org/s2', predicate: 'http://ex.org/p1', object: '"literal"' }
      ];
      mockDb.getTriples.mockResolvedValue(triples);

      const result = await graphManager.exportToTurtle();
      expect(result).toContain('<http://ex.org/s1>');
      expect(result).toContain('    <http://ex.org/p1> <http://ex.org/o1> ;');
      expect(result).toContain('    <http://ex.org/p2> <http://ex.org/o2> .');
      expect(result).toContain('<http://ex.org/s2>');
      expect(result).toContain('    <http://ex.org/p1> "literal" .');
    });
  });

  describe('backup and restore', () => {
    beforeEach(async () => {
      await graphManager.init();
    });

    it('should perform backup', async () => {
      await graphManager.backup();
      expect(mockDb.backup).toHaveBeenCalled();
    });

    it('should handle backup error', async () => {
      mockDb.backup.mockRejectedValueOnce(new Error('Backup failed'));
      await expect(graphManager.backup()).rejects.toThrow('Backup failed');
    });

    it('should restore from backup', async () => {
      await graphManager.restoreFromBackup('backup.db');
      expect(mockDb.restoreFromBackup).toHaveBeenCalledWith('backup.db');
    });

    it('should handle restore error', async () => {
      mockDb.restoreFromBackup.mockRejectedValueOnce(new Error('Restore failed'));
      await expect(graphManager.restoreFromBackup('backup.db')).rejects.toThrow('Restore failed');
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      await graphManager.init();
    });

    it('should close database connection', async () => {
      await graphManager.close();
      expect(mockDb.close).toHaveBeenCalled();
    });

    it('should handle close error', async () => {
      mockDb.close.mockRejectedValueOnce(new Error('Close failed'));
      await expect(graphManager.close()).rejects.toThrow('Close failed');
    });
  });

  describe('cleanUri', () => {
    it('should handle URIs with angle brackets', async () => {
      const turtle = '<http://example.org/subject> <http://example.org/predicate> <http://example.org/object> .';
      await graphManager.importFromTurtle(turtle);
      expect(mockDb.addTriples).toHaveBeenCalledWith([{
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      }], 'default');
    });

    it('should handle URIs without scheme', async () => {
      const turtle = '<http://example.org/subject> <http://example.org/predicate> <http://example.org/object> .';
      await graphManager.importFromTurtle(turtle);
      expect(mockDb.addTriples).toHaveBeenCalledWith([{
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      }], 'default');
    });

    it('should handle URIs with whitespace', async () => {
      const turtle = '<http://example.org/subject> <http://example.org/predicate> <http://example.org/object> .';
      await graphManager.importFromTurtle(turtle);
      expect(mockDb.addTriples).toHaveBeenCalledWith([{
        subject: 'http://example.org/subject',
        predicate: 'http://example.org/predicate',
        object: 'http://example.org/object'
      }], 'default');
    });
  });
});