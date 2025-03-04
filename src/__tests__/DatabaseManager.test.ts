import fs from 'fs';
import path from 'path';
import { DatabaseManager, DatabaseOptions } from '../db/DatabaseManager';
import { DatabaseError } from '../types/Errors';
import { ConnectionPool } from '../utils/ConnectionPool';

jest.mock('fs');
jest.mock('path');
jest.mock('../utils/ConnectionPool');

// Setup mock statement with proper types
interface MockStatement {
  run: jest.Mock<any>;
  finalize: jest.Mock<any>;
  all: jest.Mock<any>;
}

const mockStatement: MockStatement = {
  run: jest.fn((params: any[], callback: (err: Error | null) => void): MockStatement => {
    callback(null);
    return mockStatement;
  }),
  finalize: jest.fn((callback: (err: Error | null) => void): MockStatement => {
    callback(null);
    return mockStatement;
  }),
  all: jest.fn((callback: (err: Error | null, rows: any[]) => void): MockStatement => {
    callback(null, []);
    return mockStatement;
  })
};

// Mock sqlite3 module
jest.mock('sqlite3', () => {
  const mockDbPrototype = {
    exec: jest.fn((sql: string, callback: (err: Error | null) => void) => {
      callback(null);
    }),
    close: jest.fn((callback?: (err: Error | null) => void) => {
      if (callback) callback(null);
    }),
    all: jest.fn((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
      callback(null, []);
    }),
    prepare: jest.fn((sql: string) => {
      return mockStatement;
    }),
    run: jest.fn((query: string, callback: (err: Error | null) => void) => {
      if (callback) callback(null);
    })
  };

  function MockDatabase(path: string, callback: (err: Error | null) => void) {
    callback(null);
    return Object.create(mockDbPrototype);
  }

  MockDatabase.prototype = mockDbPrototype;

  return {
    Database: MockDatabase,
    verbose: () => ({ Database: MockDatabase })
  };
});

let mockDb: any;

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;
  let mockPool: jest.Mocked<ConnectionPool>;

  beforeEach(async () => {
    // Use fake timers
    jest.useFakeTimers();

    // Reset all mocks
    jest.clearAllMocks();

    // Get the mocked sqlite3 module
    const sqlite3 = require('sqlite3');

    // Setup mock database
    mockDb = new sqlite3.Database(':memory:', () => {});

    // Setup fs mock
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.createReadStream as jest.Mock).mockReturnValue({
      pipe: jest.fn(),
      on: jest.fn().mockImplementation(function(this: any, event: string, callback: Function) {
        if (event === 'error') this.errorCallback = callback;
        return this;
      }),
      destroy: jest.fn()
    });
    (fs.createWriteStream as jest.Mock).mockReturnValue({
      on: jest.fn().mockImplementation(function(this: any, event: string, callback: Function) {
        if (event === 'finish') callback();
        if (event === 'error') this.errorCallback = callback;
        return this;
      }),
      destroy: jest.fn()
    });
    (fs.readdirSync as jest.Mock).mockReturnValue(['backup_1.sqlite', 'backup_2.sqlite']);
    (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    (fs.copyFileSync as jest.Mock).mockReturnValue(undefined);

    // Setup path mock
    (path.dirname as jest.Mock).mockReturnValue('/mock/path');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Setup ConnectionPool mock
    mockPool = {
      initialize: jest.fn().mockResolvedValue(undefined),
      acquire: jest.fn().mockResolvedValue(mockDb),
      release: jest.fn().mockResolvedValue(undefined),
      maxConnections: 10,
      currentConnections: 0
    } as unknown as jest.Mocked<ConnectionPool>;
    (ConnectionPool as jest.Mock).mockImplementation(() => mockPool);

    const options: DatabaseOptions = {
      dbPath: 'test.db',
      backup: {
        enabled: true,
        interval: 3600000,
        maxBackups: 5,
        path: path.join(path.dirname('test.db'), 'backups')
      }
    };

    dbManager = new DatabaseManager(options);
    await dbManager.init();
  });

  afterEach(async () => {
    await dbManager.close();
    jest.useRealTimers();
  });

  describe('init', () => {
    it('should initialize the connection pool', async () => {
      expect(mockPool.initialize).toHaveBeenCalled();
      expect(mockPool.acquire).toHaveBeenCalled();
    });

    it('should handle pool initialization error', async () => {
      mockPool.initialize.mockRejectedValueOnce(new Error('Pool init failed'));
      const newDbManager = new DatabaseManager({ dbPath: 'test.db' });
      await expect(newDbManager.init()).rejects.toThrow(DatabaseError);
    });

    it('should handle connection acquisition error', async () => {
      mockPool.acquire.mockRejectedValueOnce(new Error('Acquire failed'));
      const newDbManager = new DatabaseManager({ dbPath: 'test.db' });
      await expect(newDbManager.init()).rejects.toThrow(DatabaseError);
    });

    it('should setup backup interval if enabled', async () => {
      const options: DatabaseOptions = {
        dbPath: 'test.db', // Use a real path to avoid early exit
        backup: {
          enabled: true,
          interval: 1000,
          path: '/test/path'
        }
      };

      const mockIntervalId = {
        unref: jest.fn().mockReturnThis()
      };
      const setIntervalSpy = jest.spyOn(global, 'setInterval').mockReturnValue(mockIntervalId as any);
      const manager = new DatabaseManager(options);
      const spy = jest.spyOn(manager as any, 'performBackupWithErrorBoundry');

      // Mock fs.existsSync to avoid file system errors
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);

      await manager.init();

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), options.backup!.interval);
      expect(mockIntervalId.unref).toHaveBeenCalled();

      // Manually trigger the backup function to verify it's called
      const backupFn = setIntervalSpy.mock.calls[0][0];
      await backupFn.call(manager);
      expect(spy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      spy.mockRestore();
      mockExistsSync.mockRestore();
      mockMkdirSync.mockRestore();
    });
  });

  describe('setupSchema', () => {
    it('should execute schema creation SQL', async () => {
      await dbManager.setupSchema();
      expect(mockDb.exec).toHaveBeenCalled();
    });

    it('should handle schema creation error', async () => {
      mockDb.exec.mockImplementationOnce((sql: string, callback: (err: Error | null) => void) => {
        callback(new DatabaseError('Schema creation failed'));
      });

      await expect(dbManager.setupSchema()).rejects.toThrow(DatabaseError);
    });
  });

  describe('backup', () => {
    it('should create backup directory if it does not exist', async () => {
      await dbManager.backup();
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should create backup file', async () => {
      await dbManager.backup();
      expect(fs.createReadStream).toHaveBeenCalledWith('test.db');
      expect(fs.createWriteStream).toHaveBeenCalled();
    });

    it('should handle backup read error', async () => {
      const mockStream = fs.createReadStream as jest.Mock;
      mockStream.mockReturnValueOnce({
        pipe: jest.fn(),
        on: jest.fn().mockImplementation((event: string, callback: Function) => {
          if (event === 'error') callback(new Error('Read error'));
          return this;
        }),
        destroy: jest.fn()
      });

      await expect(dbManager.backup()).rejects.toThrow(DatabaseError);
    });

    it('should handle backup write error', async () => {
      const mockStream = fs.createWriteStream as jest.Mock;
      mockStream.mockReturnValueOnce({
        on: jest.fn().mockImplementation((event: string, callback: Function) => {
          if (event === 'error') callback(new Error('Write error'));
          return this;
        }),
        destroy: jest.fn()
      });

      await expect(dbManager.backup()).rejects.toThrow(DatabaseError);
    });

    it('should clean up old backups', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'backup_1.sqlite',
        'backup_2.sqlite',
        'backup_3.sqlite',
        'backup_4.sqlite',
        'backup_5.sqlite',
        'backup_6.sqlite'
      ]);

      await dbManager.backup();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup file', async () => {
      await dbManager.restoreFromBackup('backup.db');
      expect(fs.copyFileSync).toHaveBeenCalledWith('backup.db', 'test.db');
    });

    it('should handle restore error', async () => {
      (fs.copyFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Copy failed');
      });

      await expect(dbManager.restoreFromBackup('backup.db')).rejects.toThrow(DatabaseError);
    });

    it('should reinitialize database after restore', async () => {
      await dbManager.restoreFromBackup('backup.db');
      expect(mockPool.initialize).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should query with all parameters', async () => {
      const mockTriples = [{ subject: 's1', predicate: 'p1', object: 'o1' }];
      mockDb.all.mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        callback(null, mockTriples);
      });

      const result = await dbManager.query('s1', 'p1', 'o1', 'test-graph');
      expect(result).toEqual(mockTriples);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE graph = ? AND subject = ? AND predicate = ? AND object = ?'),
        ['test-graph', 's1', 'p1', 'o1'],
        expect.any(Function)
      );
    });

    it('should query with partial parameters', async () => {
      await dbManager.query(undefined, 'p1', undefined, 'test-graph');
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE graph = ? AND predicate = ?'),
        ['test-graph', 'p1'],
        expect.any(Function)
      );
    });

    it('should handle query error', async () => {
      mockDb.all.mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        callback(new Error('Query failed'), []);
      });

      await expect(dbManager.query('s1', 'p1', 'o1')).rejects.toThrow(DatabaseError);
    });
  });

  describe('addTriples', () => {
    it('should add triples to the database', async () => {
      const triples = [
        { subject: 's1', predicate: 'p1', object: 'o1' },
        { subject: 's2', predicate: 'p2', object: 'o2' }
      ];

      await dbManager.addTriples(triples);
      expect(mockDb.prepare).toHaveBeenCalled();
      expect(mockStatement.run).toHaveBeenCalledTimes(triples.length);
    });

    it('should handle add triples error', async () => {
      const triples = [{ subject: 's1', predicate: 'p1', object: 'o1' }];

      mockStatement.run.mockImplementationOnce((params: any[], callback: (err: Error | null) => void) => {
        callback(new DatabaseError('Add triples failed'));
      });

      await expect(dbManager.addTriples(triples)).rejects.toThrow(DatabaseError);
    });

    it('should handle statement finalization error', async () => {
      mockStatement.finalize.mockImplementationOnce((callback: (err: Error | null) => void) => {
        callback(new Error('Finalize failed'));
      });

      await expect(dbManager.addTriples([{ subject: 's1', predicate: 'p1', object: 'o1' }]))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('getTriples', () => {
    it('should retrieve triples from the database', async () => {
      const mockTriples = [
        { subject: 's1', predicate: 'p1', object: 'o1' },
        { subject: 's2', predicate: 'p2', object: 'o2' }
      ];

      mockDb.all.mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        callback(null, mockTriples);
      });

      const result = await dbManager.getTriples();
      expect(result).toEqual(mockTriples);
    });

    it('should handle get triples error', async () => {
      mockDb.all.mockImplementationOnce((query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        callback(new DatabaseError('Get triples failed'), []);
      });

      await expect(dbManager.getTriples()).rejects.toThrow(DatabaseError);
    });
  });

  describe('clearAll', () => {
    it('should clear all triples from the database', async () => {
      await dbManager.clearAll();
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should handle clear all error', async () => {
      mockDb.run.mockImplementationOnce((query: string, callback: (err: Error | null) => void) => {
        callback(new DatabaseError('Clear all failed'));
      });

      await expect(dbManager.clearAll()).rejects.toThrow(DatabaseError);
    });
  });

  describe('close', () => {
    it('should close the database connection', async () => {
      await dbManager.close();
      expect(mockPool.release).toHaveBeenCalled();
    });

    it('should release the connection', async () => {
      await dbManager.close();
      expect(mockPool.release).toHaveBeenCalledWith(mockDb);
    });

    it('should handle release error', async () => {
      mockPool.release.mockImplementationOnce(() => { throw new Error('Release failed'); });
      await expect(dbManager.close()).rejects.toThrow(DatabaseError);
    });

    it('should clear backup interval if set', async () => {
      const mockIntervalId = {
        unref: jest.fn().mockReturnThis()
      };
      const setIntervalSpy = jest.spyOn(global, 'setInterval').mockReturnValue(mockIntervalId as any);
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const manager = new DatabaseManager({
        dbPath: 'test.db', // Use a real path to avoid early exit
        backup: {
          enabled: true,
          interval: 1000,
          path: '/test/path'
        }
      });

      // Mock fs.existsSync to avoid file system errors
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);

      await manager.init();
      await manager.close();

      expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
      mockExistsSync.mockRestore();
      mockMkdirSync.mockRestore();
    });
  });

  describe('backup and error handling', () => {
    it('should handle initialization errors', async () => {
      const mockInitialize = jest.fn().mockRejectedValue(new Error('Failed to initialize pool'));
      const mockAcquire = jest.fn();

      (ConnectionPool as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize,
        acquire: mockAcquire
      }));

      const manager = new DatabaseManager({ dbPath: ':memory:' });
      await expect(manager.init()).rejects.toThrow('Failed to initialize database: Failed to initialize pool');

      expect(mockInitialize).toHaveBeenCalled();
      expect(mockAcquire).not.toHaveBeenCalled();
    });

    it('should handle schema setup errors', async () => {
      const manager = new DatabaseManager({ dbPath: ':memory:' });
      // Don't initialize to trigger error
      await expect(manager.setupSchema()).rejects.toThrow('Database not initialized');
    });

    it('should handle errors during backup', async () => {
      const manager = new DatabaseManager({
        dbPath: 'test.db',
        backup: {
          enabled: true,
          path: '/test/path'
        }
      });

      // Mock fs.createWriteStream to throw an error
      const mockCreateWriteStream = jest.spyOn(fs, 'createWriteStream')
        .mockImplementation(() => {
          throw new Error('Failed to create write stream');
        });

      // Mock fs.existsSync and fs.mkdirSync to avoid file system errors
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);

      await manager.init();
      await expect(manager.backup()).rejects.toThrow('Failed to create write stream');

      mockCreateWriteStream.mockRestore();
      mockExistsSync.mockRestore();
      mockMkdirSync.mockRestore();
    });
  });

  describe('graph operations', () => {
    it('should handle errors when deleting a graph', async () => {
      const manager = new DatabaseManager({ dbPath: ':memory:' });
      // Don't initialize to trigger error
      await expect(manager.deleteGraph('test')).rejects.toThrow('Database not initialized');
    });

    it('should handle errors when adding triples', async () => {
      const manager = new DatabaseManager({ dbPath: ':memory:' });
      // Don't initialize to trigger error
      await expect(manager.addTriples([{ subject: 's', predicate: 'p', object: 'o' }])).rejects.toThrow('Database not initialized');
    });

    it('should handle errors when adding a single triple', async () => {
      const manager = new DatabaseManager({ dbPath: ':memory:' });
      // Don't initialize to trigger error
      await expect(manager.addTriple({ subject: 's', predicate: 'p', object: 'o' })).rejects.toThrow('Database not initialized');
    });

    it('should handle errors during query', async () => {
      const manager = new DatabaseManager({ dbPath: ':memory:' });
      // Don't initialize to trigger error
      await expect(manager.query('s', 'p', 'o')).rejects.toThrow('Database not initialized');
    });
  });
});