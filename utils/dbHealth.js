
const { getDatabase, getConnection } = require('../config/database');
const logger = require('../services/logger');

class DatabaseHealth {
  static async checkConnection() {
    try {
      const connection = getConnection();
      const result = await connection`SELECT NOW() as current_time, version() as pg_version`;
      
      logger.info('✅ Database connection healthy', {
        currentTime: result[0].current_time,
        version: result[0].pg_version.split(' ')[0]
      });
      
      return { healthy: true, ...result[0] };
    } catch (error) {
      logger.error('❌ Database connection unhealthy', { error: error.message });
      return { healthy: false, error: error.message };
    }
  }

  static async checkTables() {
    try {
      const connection = getConnection();
      const tables = await connection`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      const tableNames = tables.map(t => t.table_name);
      const expectedTables = ['users', 'messages', 'commands', 'bot_settings', 'media_downloads', 'ai_interactions'];
      const missingTables = expectedTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length > 0) {
        logger.warn('⚠️ Missing database tables', { missing: missingTables });
        return { healthy: false, tables: tableNames, missing: missingTables };
      }
      
      logger.info('✅ All database tables present', { tables: tableNames });
      return { healthy: true, tables: tableNames };
      
    } catch (error) {
      logger.error('❌ Failed to check database tables', { error: error.message });
      return { healthy: false, error: error.message };
    }
  }

  static async runHealthCheck() {
    logger.info('🔍 Running database health check...');
    
    const connectionHealth = await this.checkConnection();
    const tablesHealth = await this.checkTables();
    
    const overall = connectionHealth.healthy && tablesHealth.healthy;
    
    logger.info(`📊 Database health check ${overall ? 'PASSED' : 'FAILED'}`, {
      connection: connectionHealth.healthy,
      tables: tablesHealth.healthy
    });
    
    return {
      healthy: overall,
      connection: connectionHealth,
      tables: tablesHealth
    };
  }
}

module.exports = DatabaseHealth;
