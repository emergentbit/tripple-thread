import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { DatabaseOptions } from '../types/DatabaseOptions';
import { DatabaseError } from '../types/Errors';

export class ConnectionPool {
  private dbPath: string;
  private maxConnections: number;
  private availableConnections: sqlite3.Database[];
  private initialized: boolean;

  constructor(options: DatabaseOptions) {
    this.dbPath = options.dbPath || ':memory:';
    this.maxConnections = options.maxPoolSize || 10;
    this.availableConnections = [];
    this.initialized = false;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (this.dbPath !== ':memory:') {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      // Create initial connections
      const initialSize = Math.min(3, this.maxConnections);
      const connections = await Promise.all(
        Array(initialSize).fill(0).map(() => this.createConnection())
      );
      this.availableConnections.push(...connections);
      this.initialized = true;
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  private createConnection(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      try {
        const db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            reject(new DatabaseError(`Failed to create database connection: ${err.message}`));
            return;
          }

          // Set up error handler first
          db.on('error', (err) => {
            console.error('Database error:', err);
          });

          // Configure the database
          try {
            db.configure('busyTimeout', 1000);
            resolve(db);
          } catch (configErr: unknown) {
            const message = configErr instanceof Error ? configErr.message : String(configErr);
            db.close(() => {
              reject(new DatabaseError(`Failed to configure database: ${message}`));
            });
          }
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        reject(new DatabaseError(`Failed to create database connection: ${message}`));
      }
    });
  }

  public async acquire(): Promise<sqlite3.Database> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.availableConnections.length > 0) {
      return this.availableConnections.pop()!;
    }

    if (this.availableConnections.length < this.maxConnections) {
      return this.createConnection();
    }

    throw new DatabaseError('No available connections in the pool');
  }

  public async release(connection: sqlite3.Database): Promise<void> {
    if (this.availableConnections.length < this.maxConnections) {
      this.availableConnections.push(connection);
      return;
    }

    try {
      await this.closeConnection(connection);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Failed to close connection: ${message}`);
    }
  }

  private async closeConnection(connection: sqlite3.Database): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      connection.close((err) => {
        if (err) {
          reject(new DatabaseError(`Failed to close connection: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  public async withConnection<T>(operation: (connection: sqlite3.Database) => Promise<T>): Promise<T> {
    const connection = await this.acquire();
    let operationResult: T | undefined;
    let operationError: Error | undefined;

    try {
      operationResult = await operation(connection);
    } catch (error) {
      operationError = error instanceof Error ? error : new Error(String(error));
    }

    try {
      await this.release(connection);
    } catch (releaseError: unknown) {
      const message = releaseError instanceof Error ? releaseError.message : String(releaseError);
      if (operationError) {
        throw operationError;
      }
      throw new DatabaseError(`Failed to close connection: ${message}`);
    }

    if (operationError) {
      if (operationError instanceof DatabaseError) {
        throw operationError;
      }
      throw new DatabaseError(operationError.message);
    }

    if (operationResult === undefined) {
      throw new DatabaseError('Operation failed without returning a result');
    }

    return operationResult;
  }

  public async write<T>(operation: (connection: sqlite3.Database) => Promise<T>): Promise<T> {
    return this.withConnection(operation);
  }

  public async cleanup(): Promise<void> {
    await Promise.all(
      this.availableConnections.map(conn =>
        new Promise<void>((resolve) => {
          conn.close(() => resolve());
        })
      )
    );
    this.availableConnections = [];
    this.initialized = false;
  }
}

export class WriteQueue {
  private queue: Promise<void> = Promise.resolve();

  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const execute = async (): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        throw error;
      }
    };

    const result = this.queue
      .then(() => execute())
      .catch((error) => {
        // Reset the queue on error to allow subsequent operations
        this.queue = Promise.resolve();
        throw error;
      });

    this.queue = result.catch(() => {}) as Promise<void>; // Ignore errors in the queue chain
    return result;
  }
}