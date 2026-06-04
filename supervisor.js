const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let serverProcess = null;
let isStarting = false;

function startServer() {
  if (isStarting) return;
  isStarting = true;
  const ts = new Date().toISOString();
  console.log(`[${ts}] Starting Next.js server...`);
  
  serverProcess = spawn(process.execPath, [
    '--max-old-space-size=512',
    path.join(__dirname, '.next/standalone/server.js')
  ], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
      DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (data) => process.stdout.write(data));
  serverProcess.stderr.on('data', (data) => process.stderr.write(data));

  serverProcess.on('exit', (code, signal) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] Server exited code=${code} signal=${signal}`);
    serverProcess = null;
    isStarting = false;
    setTimeout(startServer, 2000);
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start:', err.message);
    serverProcess = null;
    isStarting = false;
    setTimeout(startServer, 5000);
  });

  // Reset starting flag after server should be ready
  setTimeout(() => { isStarting = false; }, 5000);
}

startServer();

// Keep alive
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[Health] Supervisor RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`);
}, 60000);
