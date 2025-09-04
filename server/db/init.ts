import { setupTables } from './setup';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Setup tables first
    const setupSuccess = await setupTables();
    if (!setupSuccess) {
      throw new Error('Failed to setup database tables');
    }

    // Tables and sample data are created by setupTables()

    console.log('Database initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}
