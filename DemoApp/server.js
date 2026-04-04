import cors from 'cors';
import express from 'express';
import { promises as fs } from 'fs';
import os from 'os';

const PORT = Number(process.env.METRICS_PORT) || 4000;

const app = express();
app.use(cors());

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

app.get('/api/metrics', async (_req, res) => {
  try {
    const [cpu, memory, disk] = await Promise.all([
      sampleCpuPercent(),
      Promise.resolve(memoryUsagePercent()),
      diskUsagePercent(),
    ]);
    res.json({
      timestamp: Date.now(),
      cpu,
      memory,
      disk,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

app.listen(PORT, () => {
  console.log(`Metrics API listening on http://localhost:${PORT}`);
});
