import fs from 'fs';
import path from 'path';
import { Database } from 'sqlite3';
import { DatabaseError } from '../types/Errors';
import { Triple } from '../types/Triple';
import { ConnectionPool } from '../utils/ConnectionPool';

export interface DatabaseOptions {
  dbPath: string;
  maxConnections?: number;
  backup?: {
    enabled: boolean;
    interval?: number;
    maxBackups?: number;
    path?: string;
  };
}

export class DatabaseManager {
  private db: Database | null = null;
  private backupIntervalId?: NodeJS.Timeout;
  private pool: ConnectionPool;
  private readonly dbPath: string;
  private readonly backupConfig: {
    enabled: boolean;
    interval: number;
    maxBackups: number;
    path: string;
  };

  constructor(options: DatabaseOptions) {
    this.pool = new ConnectionPool(options);
    this.dbPath = options.dbPath;
    this.backupConfig = {
      enabled: options.backup?.enabled ?? false,
      interval: options.backup?.interval ?? 3600000, // 1 hour default
      maxBackups: options.backup?.maxBackups ?? 5,
      path: options.backup?.path ?? path.join(path.dirname(this.dbPath), 'backups')
    };
  }

  async init(): Promise<void> {
    if (this.db) return;

    try {
      await this.pool.initialize();
      this.db = await this.pool.acquire();
      await this.setupSchema();
      this.setupBackupInterval();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error initializing database';
      const innerMessage = message.split(': ').pop() || message;
      throw new DatabaseError(`Failed to initialize database: ${innerMessage}`);
    }
  }

  public async setupSchema(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.db!.exec(`
          CREATE TABLE IF NOT EXISTS triples (
            subject TEXT NOT NULL,
            predicate TEXT NOT NULL,
            object TEXT NOT NULL,
            graph TEXT NOT NULL DEFAULT 'default',
            PRIMARY KEY (subject, predicate, object, graph)
          );
          CREATE INDEX IF NOT EXISTS idx_subject ON triples(subject);
          CREATE INDEX IF NOT EXISTS idx_predicate ON triples(predicate);
          CREATE INDEX IF NOT EXISTS idx_object ON triples(object);
          CREATE INDEX IF NOT EXISTS idx_graph ON triples(graph);
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Failed to setup database schema: ${message}`);
    }
  }

  private async performBackupWithErrorBoundry() {
    try {
      await this.backup();
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  private setupBackupInterval(): void {
    if (!this.backupConfig.enabled || !this.backupConfig.path || this.dbPath === ':memory:') return;

    const interval = this.backupConfig.interval || 3600000; // Default: 1 hour
    this.backupIntervalId = setInterval(this.performBackupWithErrorBoundry, interval).unref();
  }

  async backup(): Promise<void> {
    if (!this.db || !this.backupConfig.enabled || !this.backupConfig.path || this.dbPath === ':memory:') {
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupConfig.path, `backup_${timestamp}.sqlite`);

      // Ensure backup directory exists
      fs.mkdirSync(this.backupConfig.path, { recursive: true });

      // Create backup using streaming
      await new Promise<void>((resolve, reject) => {
        const source = fs.createReadStream(this.dbPath!);
        const backup = fs.createWriteStream(backupPath);

        source.on('error', (error) => {
          backup.destroy();
          reject(new DatabaseError(`Backup read error: ${error.message}`));
        });

        backup.on('error', (error) => {
          source.destroy();
          reject(new DatabaseError(`Backup write error: ${error.message}`));
        });

        backup.on('finish', () => {
          source.destroy();
          resolve();
        });

        source.pipe(backup);
      });

      // Remove old backups if maxBackups is set
      if (this.backupConfig.maxBackups) {
        const backups = fs.readdirSync(this.backupConfig.path)
          .filter(file => file.endsWith('.sqlite'))
          .sort()
          .reverse();

        if (backups.length > this.backupConfig.maxBackups) {
          const toDelete = backups.slice(this.backupConfig.maxBackups);
          for (const file of toDelete) {
            fs.unlinkSync(path.join(this.backupConfig.path, file));
          }
        }
      }
    } catch (error) {
      throw error instanceof DatabaseError ? error : new DatabaseError(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized');

    try {
      await new Promise<void>((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Copy backup to main database
      fs.copyFileSync(backupPath, this.dbPath || ':memory:');

      // Reinitialize database
      await this.init();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error during restore';
      throw new DatabaseError(`Restore failed: ${message}`);
    }
  }

  async addTriple(triple: Triple, graph: string = 'default'): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }
    await this.addTriples([triple], graph);
  }

  async addTriples(triples: Triple[], graph: string = 'default'): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    const stmt = this.db.prepare(
      'INSERT INTO triples (subject, predicate, object, graph) VALUES (?, ?, ?, ?)'
    );

    try {
      for (const triple of triples) {
        await new Promise<void>((resolve, reject) => {
          stmt.run(
            [triple.subject, triple.predicate, triple.object, graph],
            (err) => {
              if (err) reject(new DatabaseError(`Failed to add triple: ${err.message}`));
              resolve();
            }
          );
        });
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        stmt.finalize((err) => {
          if (err) reject(new DatabaseError(`Failed to finalize statement: ${err.message}`));
          resolve();
        });
      });
    }
  }

  async query(
    subject?: string,
    predicate?: string,
    object?: string,
    graph: string = 'default'
  ): Promise<Triple[]> {
    if (!this.db) throw new DatabaseError('Database not initialized');

    try {
      let sql = 'SELECT * FROM triples WHERE graph = ?';
      const params: any[] = [graph];

      if (subject) {
        sql += ' AND subject = ?';
        params.push(subject);
      }
      if (predicate) {
        sql += ' AND predicate = ?';
        params.push(predicate);
      }
      if (object) {
        sql += ' AND object = ?';
        params.push(object);
      }

      return new Promise<Triple[]>((resolve, reject) => {
        this.db!.all(sql, params, (err, rows) => {
          if (err) {
            const message = err instanceof Error ? err.message : 'Unknown error during query';
            reject(new DatabaseError(`Query failed: ${message}`));
          } else {
            resolve(rows as Triple[]);
          }
        });
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error during query';
      throw new DatabaseError(`Query failed: ${message}`);
    }
  }

  async deleteGraph(graph: string): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized');

    try {
      await new Promise<void>((resolve, reject) => {
        this.db!.run('DELETE FROM triples WHERE graph = ?', [graph], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error deleting graph';
      throw new DatabaseError(`Failed to delete graph: ${message}`);
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized');

    await new Promise<void>((resolve, reject) => {
      this.db!.run('DELETE FROM triples', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        this.pool.release(this.db);
      } catch (error) {
        throw new DatabaseError(`Failed to close database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      this.db = null;
    }

    if (this.backupIntervalId) {
      clearInterval(this.backupIntervalId);
      this.backupIntervalId = undefined;
    }
  }

  async getTriples(graph: string = 'default'): Promise<Triple[]> {
    if (!this.db) throw new DatabaseError('Database not initialized');

    return new Promise<Triple[]>((resolve, reject) => {
      this.db!.all(
        'SELECT subject, predicate, object FROM triples WHERE graph = ?',
        [graph],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Triple[]);
        }
      );
    });
  }
}