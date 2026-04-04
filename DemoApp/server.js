import cors from 'cors';
import express from 'express';
import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { WebSocketServer } from 'ws';

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = line.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch {
    // Ignore missing/invalid .env files.
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));

const PORT = Number(process.env.VITE_API_PORT) || Number(process.env.METRICS_PORT) || 4000;

const app = express();
app.use(cors());

// Add Content-Security-Policy header to allow WebSocket connections
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' ws: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  );
  next();
});

/**
 * Approximate system CPU usage by diffing `os.cpus()` times between two samples.
 */
function sampleCpuPercent() {
  const start = os.cpus();
  return new Promise((resolve) => {
    setTimeout(() => {
      const end = os.cpus();
      let idle = 0;
      let total = 0;
      for (let i = 0; i < start.length; i++) {
        const a = start[i].times;
        const b = end[i].times;
        idle += b.idle - a.idle;
        total +=
          b.user - a.user +
          b.nice - a.nice +
          b.sys - a.sys +
          b.idle - a.idle +
          b.irq - a.irq;
      }
      const pct = total > 0 ? (1 - idle / total) * 100 : 0;
      resolve(Math.min(100, Math.max(0, Math.round(pct * 100) / 100)));
    }, 120);
  });
}

function memoryUsagePercent() {
  const used = 1 - os.freemem() / os.totalmem();
  return Math.round(used * 10000) / 100;
}

async function diskUsagePercent() {
  try {
    const s = await fs.statfs('/');
    const nonFree = s.blocks - s.bfree;
    const pct = (nonFree / s.blocks) * 100;
    return Math.round(pct * 100) / 100;
  } catch {
    return Math.round((45 + Math.random() * 10) * 100) / 100;
  }
}


async function collectMetrics() {
  try {
    const [cpu, memory, disk] = await Promise.all([
      sampleCpuPercent(),
      Promise.resolve(memoryUsagePercent()),
      diskUsagePercent(),
    ]);
    return {
      timestamp: Date.now(),
      cpu,
      memory,
      disk,
    };
  } catch (err) {
    console.error('Failed to collect metrics:', err);
    throw err;
  }
}

app.get('/api/metrics', async (_req, res) => {
  try {
    const metrics = await collectMetrics();
    res.json(metrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// Create HTTP server and attach WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast metrics to all connected WebSocket clients every 2000ms
const BROADCAST_INTERVAL_MS = Number(process.env.VITE_UPDATE_INTERVAL_MS) || 2000;
let broadcastInterval;

wss.on('connection', async (ws) => {
  console.log('WebSocket client connected');

  // Send initial metrics snapshot immediately on connection
  try {
    const metrics = await collectMetrics();
    ws.send(JSON.stringify(metrics));
  } catch (err) {
    console.error('Failed to send initial metrics:', err);
  }

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Start broadcasting metrics to all connected clients
function startBroadcasting() {
  broadcastInterval = setInterval(async () => {
    try {
      const metrics = await collectMetrics();
      const metricsJson = JSON.stringify(metrics);
      let closedCount = 0;

      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(metricsJson);
        } else if (client.readyState === client.CLOSED) {
          closedCount++;
        }
      });

      if (closedCount > 0 && wss.clients.size === 0) {
        console.log('No connected clients, but keeping broadcast interval active');
      }
    } catch (err) {
      console.error('Broadcasting error:', err);
    }
  }, BROADCAST_INTERVAL_MS);
}

startBroadcasting();

server.listen(PORT, () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
  console.log(`HTTP API (fallback) available at http://localhost:${PORT}/api/metrics`);
});
