import {
  BarChart,
  GaugeChart,
  LineChart,
  type ChartData,
} from '@leadtek/chart-components';
import {
  Box,
  Container,
  FormControl,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useEffect, useMemo, useState } from 'react';

type Scenario = 'normal' | 'loading' | 'malformed';

interface MetricsPayload {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
}

const HISTORY_LIMIT = 24;
const POLL_MS = 2000;

const METRIC_COLORS = {
  cpu: '#1976d2',
  memory: '#9c27b0',
  disk: '#2e7d32',
} as const;

const METRIC_TRACK_COLORS = {
  cpu: '#d7e8fb',
  memory: '#eedaf7',
  disk: '#d9efe0',
} as const;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const malformedLineData: ChartData = {
  title: 'Malformed (invalid series)',
  labels: ['a', 'b'],
  series: [{ label: 'Broken', data: [1, NaN, 3] }],
};

const malformedBarData: ChartData = {
  title: 'Malformed (length mismatch)',
  labels: ['CPU', 'Memory'],
  series: [{ label: 'Usage %', data: [10, 20, 30] }],
};

const malformedGaugeData: ChartData = {
  title: 'Malformed gauge',
  gauges: [
    {
      title: 'Broken gauge',
      value: Number.NaN,
      gaugeLabel: 'Should show validation error',
    },
  ],
};

export function App() {
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [history, setHistory] = useState<MetricsPayload[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (scenario !== 'normal') {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch('/api/metrics');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const payload: MetricsPayload = await res.json();
        if (cancelled) {
          return;
        }
        setFetchError(null);
        setHistory((prev) => {
          const next = [...prev, payload];
          return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
        });
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : 'Request failed');
        }
      }
    };

    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [scenario]);

  const latest = history[history.length - 1];

  const lineData: ChartData = useMemo(() => {
    if (scenario === 'malformed') {
      return malformedLineData;
    }
    return {
      title: 'CPU / Memory / Disk over time',
      labels: history.map((h) => formatTime(h.timestamp)),
      series: [
        { label: 'CPU %', data: history.map((h) => h.cpu), color: METRIC_COLORS.cpu },
        { label: 'Memory %', data: history.map((h) => h.memory), color: METRIC_COLORS.memory },
        { label: 'Disk %', data: history.map((h) => h.disk), color: METRIC_COLORS.disk },
      ],
    };
  }, [history, scenario]);

  const barData: ChartData = useMemo(() => {
    if (scenario === 'malformed') {
      return malformedBarData;
    }
    if (!latest) {
      return { title: 'Current snapshot', labels: [], series: [] };
    }
    return {
      title: 'Current resource comparison',
      labels: ['Current usage'],
      series: [
        { label: 'CPU %', data: [latest.cpu], color: METRIC_COLORS.cpu },
        { label: 'Memory %', data: [latest.memory], color: METRIC_COLORS.memory },
        { label: 'Disk %', data: [latest.disk], color: METRIC_COLORS.disk },
      ],
    };
  }, [latest, scenario]);

  const gaugeData: ChartData = useMemo(() => {
    if (scenario === 'malformed') {
      return malformedGaugeData;
    }
    return {
      title: 'Gauges',
      gauges: [
        {
          title: 'CPU',
          value: latest?.cpu ?? 0,
          gaugeLabel: 'Processor usage',
          color: METRIC_COLORS.cpu,
          trackColor: METRIC_TRACK_COLORS.cpu,
        },
        {
          title: 'Memory',
          value: latest?.memory ?? 0,
          gaugeLabel: 'RAM usage',
          color: METRIC_COLORS.memory,
          trackColor: METRIC_TRACK_COLORS.memory,
        },
        {
          title: 'Disk',
          value: latest?.disk ?? 0,
          gaugeLabel: 'Volume usage (approx.)',
          color: METRIC_COLORS.disk,
          trackColor: METRIC_TRACK_COLORS.disk,
        },
      ],
    };
  }, [latest, scenario]);

  const chartsLoading =
    scenario === 'loading' || (scenario === 'normal' && history.length === 0 && !fetchError);

  const barLoading =
    scenario === 'loading' || (scenario === 'normal' && !latest && !fetchError);

  return (
    <Box sx={{ py: 3, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            System Monitoring Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live metrics from the local Express API. Switch scenarios to validate loading and error handling
            in the chart library.
          </Typography>
          <FormControl component="fieldset">
            <FormLabel component="legend">Test scenario</FormLabel>
            <RadioGroup
              row
              value={scenario}
              onChange={(_, v) => setScenario(v as Scenario)}
            >
              <FormControlLabel value="normal" control={<Radio />} label="1. Normal data" />
              <FormControlLabel value="loading" control={<Radio />} label="2. Empty / loading" />
              <FormControlLabel value="malformed" control={<Radio />} label="3. Malformed data" />
            </RadioGroup>
          </FormControl>
          {fetchError ? (
            <Typography color="error" variant="body2">
              API error: {fetchError} (is the backend running on port 4000?)
            </Typography>
          ) : null}
        </Stack>

        <Stack spacing={3}>
          <Paper sx={{ p: 2 }}>
            <LineChart data={lineData} loading={chartsLoading} height={340} />
          </Paper>
            <Paper sx={{ p: 2}}>
              <BarChart data={barData} loading={barLoading} height={320} />
            </Paper>
            <Paper sx={{ p: 2}}>
              <Stack spacing={2}>
                <GaugeChart data={gaugeData} loading={chartsLoading} />
              </Stack>
            </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
