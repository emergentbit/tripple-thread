import os from 'os';
import path from 'path';
import { DatabaseError } from '../types/Errors';
import { ConnectionPool, WriteQueue } from '../utils/ConnectionPool';

// Mock modules
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockReturnValue(false),
    mkdirSync: jest.fn(),
    rmSync: jest.fn(),
  };
});
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    join: jest.fn().mockImplementation((...args) => args.join('/')),
  };
});

// Define types for mock functions
type SqlCallback = (err: Error | null) => void;
type QueryCallback = (err: Error | null, rows: unknown[] | unknown | null) => void;

// Create synchronous mock methods
const mockExec = jest.fn().mockImplementation((sql: string, callback: SqlCallback) => {
  callback(null);
});
const mockClose = jest.fn().mockImplementation((callback: SqlCallback) => {
  callback(null);
});
const mockAll = jest.fn().mockImplementation((sql: string, params: unknown[], callback: QueryCallback) => {
  callback(null, []);
});
const mockRun = jest.fn().mockImplementation((sql: string, params: unknown[], callback: SqlCallback) => {
  callback(null);
});
const mockGet = jest.fn().mockImplementation((sql: string, callback: QueryCallback) => {
  callback(null, { value: 1 });
});
const mockConfigure = jest.fn().mockImplementation((option: string, value: number) => {
  if (option === 'busyTimeout' && typeof value === 'number') {
    return true;
  }
  throw new Error('Invalid configuration');
});

// Create a mock database instance with proper types
const createMockDb = () => {
  const db = {
    exec: mockExec,
    close: mockClose,
    all: mockAll,
    run: mockRun,
    get: mockGet,
    configure: mockConfigure,
    on: jest.fn().mockImplementation((event: string, handler: (err: Error) => void) => db)
  };
  return db;
};

// Mock sqlite3 with proper types
jest.mock('sqlite3', () => {
  return {
    Database: jest.fn().mockImplementation((path: string, callback?: (err: Error | null, db: any) => void) => {
      if (path === '/invalid/path/db.sqlite') {
        if (callback) callback(new Error('Failed to initialize'), null);
        throw new Error('Failed to initialize');
      }

      const db = createMockDb();
      if (callback) {
        process.nextTick(() => callback(null, db));
      }
      return db;
    })
  };
});

// Helper function to run async tests with timeout
const runAsyncTest = async (testFn: () => Promise<void>) => {
  return Promise.race([
    testFn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Test timed out')), 5000)
    )
  ]);
};

describe('ConnectionPool', () => {
  let pool: ConnectionPool;
  let fs: jest.Mocked<typeof import('fs')>;

  beforeEach(async () => {
    jest.clearAllMocks();
    fs = jest.requireMock('fs');
    pool = new ConnectionPool({ dbPath: ':memory:' });
  });

  afterEach(async () => {
    await pool.cleanup();
  });

  it('should initialize successfully', async () => {
    await pool.initialize();
    expect(pool['availableConnections'].length).toBeGreaterThan(0);
  });

  it('should handle directory creation for file-based databases', async () => {
    const tempDir = '/tmp/test-db';
    const pool = new ConnectionPool({ dbPath: tempDir + '/test.db' });

    await pool.initialize();
    expect(fs.mkdirSync).toHaveBeenCalledWith(tempDir, { recursive: true });
    expect(fs.existsSync).toHaveBeenCalledWith(tempDir);

    await pool.cleanup();
  });

  it('should skip directory creation if path exists', async () => {
    const fs = jest.requireMock('fs');
    fs.existsSync.mockReturnValue(true);

    const tempDir = path.join(os.tmpdir(), 'test-db');
    const pool = new ConnectionPool({ dbPath: path.join(tempDir, 'test.db') });

    await pool.initialize();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(pool['availableConnections'].length).toBeGreaterThan(0);

    await pool.cleanup();
  });

  it('should handle initialization errors', async () => {
    const sqlite3 = jest.requireMock('sqlite3');
    sqlite3.Database.mockImplementationOnce((path: string, callback?: (err: Error | null, db: any) => void) => {
      if (callback) callback(new Error('Failed to initialize'), null);
      throw new Error('Failed to initialize');
    });
    pool = new ConnectionPool({ dbPath: ':memory:' });
    await expect(pool.initialize()).rejects.toThrow('Failed to initialize');
  });

  it('should acquire and release connections', async () => {
    await pool.initialize();
    const result = await pool.withConnection(async (db) => {
      return new Promise((resolve) => {
        db.get('SELECT 1', (err, row) => {
          expect(err).toBeNull();
          resolve(row);
        });
      });
    });
    expect(result).toBeDefined();
  });

  it('should handle max pool size', async () => {
    const smallPool = new ConnectionPool({ dbPath: ':memory:', maxPoolSize: 2 });
    await smallPool.initialize();

    const operations = Array(3).fill(0).map(() =>
      smallPool.withConnection(async (db) => {
        return new Promise((resolve) => {
          db.get('SELECT 1', (err, row) => {
            expect(err).toBeNull();
            resolve(row);
          });
        });
      })
    );

    const results = await Promise.all(operations);
    expect(results.length).toBe(3);

    await smallPool.cleanup();
  });

  it('should handle connection errors', async () => {
    const invalidPool = new ConnectionPool({ dbPath: '/invalid/path/db.sqlite' });
    await expect(invalidPool.initialize()).rejects.toThrow(DatabaseError);
  });

  it('should handle release errors', async () => {
    await pool.initialize();
    const db = pool['availableConnections'][0];

    // Mock the close method to always fail
    const mockCloseError = new Error('Release error');
    db.close = jest.fn().mockImplementation((callback) => {
      // if (typeof callback === 'function') {
        callback(mockCloseError);
      // }
    });

    // Remove the connection from the pool to force close
    pool['availableConnections'] = [];

    // First operation succeeds, but release fails
    await expect(pool.release(db)).rejects.toThrow('Failed to close connection: Release error');
    // await expect(pool.withConnection(async () => {
    //   return Promise.resolve('test');
    // })).rejects.toThrow('Failed to close connection: Release error');
  });

  it('should handle multiple releases of the same connection', async () => {
    await pool.initialize();
    const db = pool['availableConnections'][0];
    await pool.withConnection(async (db) => {
      return new Promise((resolve) => {
        db.get('SELECT 1', (err, row) => {
          expect(err).toBeNull();
          resolve(row);
        });
      });
    });

    await expect(pool.withConnection(async (db) => {
      return new Promise((resolve) => {
        db.get('SELECT 1', (err, row) => {
          expect(err).toBeNull();
          resolve(row);
        });
      });
    })).resolves.toBeDefined();
  });

  it('should execute operations with connection', async () => {
    await pool.initialize();
    const result = await pool.withConnection(async (db) => {
      return new Promise((resolve) => {
        db.get('SELECT 1', (err, row) => {
          expect(err).toBeNull();
          resolve(row);
        });
      });
    });
    expect(result).toBeDefined();
  });

  it('should handle operation failures', async () => {
    await pool.initialize();
    await expect(pool.withConnection(async () => {
      throw new Error('Operation failed');
    })).rejects.toThrow('Operation failed');
  });

  it('should release connection after operation', async () => {
    await pool.initialize();
    const initialConnections = pool['availableConnections'].length;
    await pool.withConnection(async (db) => {
      return new Promise((resolve) => {
        db.get('SELECT 1', (err, row) => {
          expect(err).toBeNull();
          resolve(row);
        });
      });
    });
    expect(pool['availableConnections'].length).toBe(initialConnections);
  });

  it('should release connection even after operation failure', async () => {
    await pool.initialize();
    const initialConnections = pool['availableConnections'].length;
    await expect(pool.withConnection(async () => {
      throw new Error('Operation failed');
    })).rejects.toThrow('Operation failed');
    expect(pool['availableConnections'].length).toBe(initialConnections);
  });

  it('should handle database errors during operation', async () => {
    await pool.initialize();
    const db = pool['availableConnections'][0];

    // Mock the get method to always fail
    const mockDbError = new Error('Database error');
    db.get = jest.fn().mockImplementation((sql: string, callback: QueryCallback) => {
      if (typeof callback === 'function') {
        callback(mockDbError, null);
      }
    });

    await expect(pool.withConnection(async (conn) => {
      return new Promise((resolve, reject) => {
        conn.get('SELECT 1', (err) => {
          if (err) {
            reject(new DatabaseError(err.message));
            return;
          }
          resolve({ value: 1 });
        });
      });
    })).rejects.toThrow('Database error');
  });
});

describe('WriteQueue', () => {
  let queue: WriteQueue;

  beforeEach(() => {
    queue = new WriteQueue();
  });

  it('should execute operations in sequence', async () => {
    await runAsyncTest(async () => {
      const results: number[] = [];
      const op1 = () => Promise.resolve().then(() => results.push(1));
      const op2 = () => Promise.resolve().then(() => results.push(2));

      await Promise.all([
        queue.enqueue(op1),
        queue.enqueue(op2)
      ]);

      expect(results).toEqual([1, 2]);
    });
  });

  it('should handle operation errors without blocking queue', async () => {
    await runAsyncTest(async () => {
      const error = new Error('Operation failed');
      const failingOp = jest.fn().mockRejectedValue(error);
      const successOp = jest.fn().mockResolvedValue('success');

      const failPromise = queue.enqueue(failingOp);
      const successPromise = queue.enqueue(successOp);

      await expect(failPromise).rejects.toThrow(error);
      const result = await successPromise;

      expect(result).toBe('success');
      expect(failingOp).toHaveBeenCalled();
      expect(successOp).toHaveBeenCalled();
    });
  });

  it('should maintain operation order even with errors', async () => {
    await runAsyncTest(async () => {
      const results: string[] = [];
      const op1 = () => Promise.reject(new Error('op1-error'));
      const op2 = () => Promise.resolve().then(() => results.push('op2'));

      const failPromise = queue.enqueue(op1);
      const successPromise = queue.enqueue(op2);

      await expect(failPromise).rejects.toThrow('op1-error');
      await successPromise;

      expect(results).toEqual(['op2']);
    });
  });
});