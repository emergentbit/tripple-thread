import * as fs from 'fs';
import * as path from 'path';
import { GraphManager } from '../src';
import { DatabaseManager } from '../src/db/DatabaseManager';

/**
 * This example demonstrates how to:
 * - Configure automatic backups
 * - Trigger manual backups
 * - Restore from backups
 * - Handle backup rotation
 */

async function backupRestoreExample() {
  let db: DatabaseManager | null = null;
  let graph: GraphManager | null = null;

  try {
    // Create data directories if they don't exist
    const dataDir = './data';
    const backupDir = './data/backups';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Initialize database with backup enabled
    db = new DatabaseManager({
      dbPath: './data/backup-example.sqlite',
      backup: {
        enabled: true,
        path: backupDir,
        interval: 60000,     // Backup every minute (for demonstration)
        maxBackups: 5        // Keep only last 5 backups
      }
    });

    graph = new GraphManager(db);
    await graph.init();

    if (!graph) {
      throw new Error('Failed to initialize graph manager');
    }

    console.log('Example 1: Adding data and waiting for automatic backup');
    console.log('--------------------------------------------------');

    // Add some initial data
    await graph.addTriple({
      subject: 'http://example.org/book1',
      predicate: 'http://example.org/title',
      object: '"The Great Gatsby"'
    });

    console.log('Added initial data, waiting for automatic backup...');
    await new Promise(resolve => setTimeout(resolve, 65000)); // Wait for auto-backup

    // Add more data
    await graph.addTriple({
      subject: 'http://example.org/book1',
      predicate: 'http://example.org/author',
      object: '"F. Scott Fitzgerald"'
    });

    console.log('\nExample 2: Manual backup');
    console.log('----------------------');

    // Trigger a manual backup
    await graph.backup();
    console.log('Manual backup completed');

    // Add more data
    await graph.addTriple({
      subject: 'http://example.org/book1',
      predicate: 'http://example.org/year',
      object: '"1925"'
    });

    console.log('\nExample 3: Restoring from backup');
    console.log('-----------------------------');

    // Get the latest backup file
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sqlite'))
      .sort()
      .reverse();

    if (backups.length > 0) {
      const latestBackup = path.join(backupDir, backups[0]);
      console.log(`Restoring from backup: ${latestBackup}`);

      // Restore from the backup
      await graph.restoreFromBackup(latestBackup);

      // Query to verify the restore
      const query = `
        SELECT ?p ?o
        WHERE {
          <http://example.org/book1> ?p ?o
        }
      `;
      const results = await graph.query(query);
      console.log('Data after restore:', results);
    }

    console.log('\nExample 4: Backup rotation');
    console.log('------------------------');

    // Create multiple backups to demonstrate rotation
    for (let i = 0; i < 6; i++) {
      await graph.backup();
      console.log(`Created backup ${i + 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between backups
    }

    // List remaining backups
    const remainingBackups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sqlite'));
    console.log(`\nRemaining backups (should be 5 or less):`, remainingBackups);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (graph) {
      await graph.close();
    }
  }
}

// Run the example
backupRestoreExample().catch(console.error);