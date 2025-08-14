const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs-extra');
const path = require('path');

const logger = require('../services/logger');

let db = null;
let connection = null;

async function initializeDatabase() {
  try {
    logger.info('🗄️ Initializing PostgreSQL connection...');

    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

    if (!connectionString || connectionString.includes('undefined')) {
      throw new Error('Database connection string is invalid. Please check environment variables.');
    }

    // Create postgres connection with better error handling
    connection = postgres(connectionString, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 60,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
      onnotice: () => {}, // Suppress notices
      transform: {
        undefined: null
      }
    });

    // Initialize Drizzle ORM
    db = drizzle(connection);

    // Test connection with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await connection`SELECT 1 as test`;
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        logger.warn(`Database connection test failed, retrying... (${3 - retries}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    logger.success('✅ PostgreSQL connected successfully');

    // Run migrations
    await runMigrations();

    return db;

  } catch (error) {
    logger.error('💥 Failed to initialize database', { 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function runMigrations() {
  try {
    logger.info('🔄 Running database migrations...');

    const migrationFile = path.join(__dirname, '..', 'db', 'migrations', '0000_initial.sql');

    if (await fs.pathExists(migrationFile)) {
      const migrationSQL = await fs.readFile(migrationFile, 'utf8');

      // Execute migration with error handling
      try {
        await connection.unsafe(migrationSQL);
        logger.success('✅ Migrations completed successfully');
      } catch (error) {
        // Check if error is due to tables already existing
        if (error.message.includes('already exists')) {
          logger.info('ℹ️ Database tables already exist, skipping migration');
        } else {
          throw error;
        }
      }
    } else {
      logger.warn('⚠️ No migration file found, skipping...');
    }

  } catch (error) {
    logger.error('💥 Migration failed', { 
      error: error.message 
    });
    throw error;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

function getConnection() {
  if (!connection) {
    throw new Error('Database connection not established.');
  }
  return connection;
}

async function closeDatabase() {
  if (connection) {
    await connection.end();
    logger.info('✅ Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  getConnection,
  closeDatabase
};