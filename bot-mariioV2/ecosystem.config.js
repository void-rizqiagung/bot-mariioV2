// PM2 Ecosystem file for production deployment
module.exports = {
  apps: [{
    name: 'whatsapp-bot',
    script: 'start.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    
    // Restart settings
    restart_delay: 5000,
    max_restarts: 50,
    min_uptime: '30s',
    
    // Auto-restart on crashes
    exp_backoff_restart_delay: 100,
    
    // Health monitoring
    health_check_http: 'http://localhost:5000/health',
    health_check_grace_period: 30000
  }]
};