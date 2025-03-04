export interface DatabaseOptions {
  dbPath?: string;
  enableBackup?: boolean;
  backupPath?: string;
  backupConfig?: {
    interval?: number;
    maxBackups?: number;
  };
  maxPoolSize?: number;
  backupInterval?: number;
}