import { GraphManager } from '../src';

/**
 * This example demonstrates how to:
 * - Configure automatic backups
 * - Trigger manual backups
 * - Restore from backups
 * - Handle backup rotation
 */

async function backupRestoreExample() {
  // Create a GraphManager with backup enabled
  const graphManager = new GraphManager({
    dbPath: './data/backup-example.sqlite',
    enableBackup: true,
    backupPath: './data/backups',
    backupConfig: {
      interval: 60000,     // Backup every minute (for demonstration)
      maxBackups: 5        // Keep only last 5 backups
    }
  });

  try {
    // Initialize the database
    await graphManager.init();

    console.log('Example 1: Adding data and waiting for automatic backup');
    console.log('--------------------------------------------------');

    // Add some initial data
    await graphManager.addTriple({
      subject: 'http://example.org/book1',
      predicate: 'http://example.org/title',
      object: '"The Great Gatsby"'
    });

    console.log('Added initial data, waiting for automatic backup...');
    await new Promise(resolve => setTimeout(resolve, 65000)); // Wait for auto-backup

    // Add more data
    await graphManager.addTriple({
      subject: 'http://example.org/book1',
      predicate: 'http://example.org/author',
      object: '"F. Scott Fitzgerald"'
    });

    console.log('\nExample 2: Manual backup');
    console.log('----------------------');

    // Trigger a manual backup
    await graphManager.backup();
    console.log('Manual backup completed');

    // Add more data
    await graphManager.addTriple({
      subject: 'http://example.org/book1',
      predicate: 'http://example.org/year',
      object: '"1925"'
    });

    console.log('\nExample 3: Restoring from backup');
    console.log('-----------------------------');

    // Get the latest backup file
    const fs = require('fs');
    const path = require('path');
    const backups = fs.readdirSync('./data/backups')
      .filter(file => file.endsWith('.sqlite'))
      .sort()
      .reverse();

    if (backups.length > 0) {
      const latestBackup = path.join('./data/backups', backups[0]);
      console.log(`Restoring from backup: ${latestBackup}`);

      // Restore from the backup
      await graphManager.restoreFromBackup(latestBackup);

      // Query to verify the restore
      const results = await graphManager.query('http://example.org/book1');
      console.log('Data after restore:', results);
    }

    console.log('\nExample 4: Backup rotation');
    console.log('------------------------');

    // Create multiple backups to demonstrate rotation
    for (let i = 0; i < 6; i++) {
      await graphManager.backup();
      console.log(`Created backup ${i + 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between backups
    }

    // List remaining backups
    const remainingBackups = fs.readdirSync('./data/backups')
      .filter(file => file.endsWith('.sqlite'));
    console.log(`\nRemaining backups (should be 5 or less):`, remainingBackups);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await graphManager.close();
  }
}

// Run the example
backupRestoreExample().catch(console.error);