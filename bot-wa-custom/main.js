#!/usr/bin/env node

/**
 * WhatsApp AI Bot - Main Entry Point with Auto-Restart
 * Simple production launcher dengan server.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WhatsApp AI Bot...');

let restartCount = 0;
const maxRestarts = 10;

function startServer() {
    console.log(`🔄 Starting server (attempt ${restartCount + 1})`);

    // Start server.js yang berisi bot dan web dashboard
    const server = spawn('node', ['server.js'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: { 
            ...process.env, 
            NODE_ENV: 'production',
            BOT_RESTART_COUNT: restartCount.toString()
        }
    });

    // Handle server exit
    server.on('exit', (code, signal) => {
        console.log(`📱 Server exited with code ${code} and signal ${signal}`);

        if (code !== 0 && restartCount < maxRestarts) {
            restartCount++;
            console.log(`🔄 Restarting in 5 seconds... (${restartCount}/${maxRestarts})`);
            setTimeout(startServer, 5000);
        } else if (restartCount >= maxRestarts) {
            console.log('❌ Max restart attempts reached. Exiting...');
            process.exit(1);
        }
    });

    // Handle process errors
    server.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        if (restartCount < maxRestarts) {
            restartCount++;
            setTimeout(startServer, 10000);
        }
    });
}

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGTERM', () => {
  if (!isShuttingDown) {
    isShuttingDown = true;
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    setTimeout(() => {
      process.exit(0);
    }, 5000); // Give 5 seconds for graceful shutdown
  }
});

process.on('SIGINT', () => {
  if (!isShuttingDown) {
    isShuttingDown = true;
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  }
});

// Prevent multiple shutdowns
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception', { error: error.message, stack: error.stack });
  if (!isShuttingDown) {
    isShuttingDown = true;
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  }
});

// Start server
startServer();