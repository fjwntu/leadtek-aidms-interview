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

const DEFAULT_POLL_MS = 2000;
const parsedPollMs = Number(import.meta.env.VITE_UPDATE_INTERVAL_MS);
const POLL_MS = Number.isFinite(parsedPollMs) && parsedPollMs > 0
  ? parsedPollMs
  : DEFAULT_POLL_MS;

const DEFAULT_LINE_HISTORY_COUNT = 20;
const parsedLineHistoryCount = Number(import.meta.env.VITE_LINE_HISTORY_COUNT);
const LINE_HISTORY_COUNT =
  Number.isFinite(parsedLineHistoryCount) && parsedLineHistoryCount > 0
    ? Math.floor(parsedLineHistoryCount)
    : DEFAULT_LINE_HISTORY_COUNT;

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
  const [latest, setLatest] = useState<MetricsPayload | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (scenario !== 'normal') {
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        // Connect directly to backend WebSocket server
        // In development: read port from VITE_API_PORT env variable
        // In production: use the same protocol and host as the page
        const isDev = !import.meta.env.PROD;
        let wsUrl: string;
        
        if (isDev) {
          // Development: connect directly to backend using port from env
          const apiPort = import.meta.env.VITE_API_PORT || '4000';
          wsUrl = `ws://localhost:${apiPort}`;
        } else {
          // Production: use the same protocol and host as the current page
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host;
          wsUrl = `${protocol}//${host}`;
        }

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (cancelled) {
            ws?.close();
            return;
          }
          console.log('WebSocket connected');
          setFetchError(null);
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const payload: MetricsPayload = JSON.parse(event.data);
            setLatest(payload);
            setFetchError(null);
          } catch (e) {
            setFetchError(e instanceof Error ? `Parse error: ${e.message}` : 'Parse error');
          }
        };

        ws.onerror = () => {
          if (!cancelled) {
            setFetchError('WebSocket connection error');
          }
        };

        ws.onclose = () => {
          if (!cancelled) {
            setFetchError('WebSocket connection closed');
            // Optionally attempt to reconnect after a delay
            setTimeout(() => {
              if (!cancelled) {
                connectWebSocket();
              }
            }, 3000);
          }
        };
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : 'Connection failed');
        }
      }
    };

    connectWebSocket();

    return () => {
      cancelled = true;
      if (ws) {
        ws.close();
      }
    };
  }, [scenario]);

  const lineData: ChartData = useMemo(() => {
    if (scenario === 'malformed') {
      return malformedLineData;
    }
    if (scenario === 'normal' && fetchError) {
      return { title: 'CPU / Memory / Disk over time', labels: [], series: [] };
    }
    return {
      title: 'CPU / Memory / Disk over time',
      labels: [latest?.timestamp ?? Date.now()],
      series: [
        { label: 'CPU %', data: [latest?.cpu ?? 0], color: METRIC_COLORS.cpu },
        { label: 'Memory %', data: [latest?.memory ?? 0], color: METRIC_COLORS.memory },
        { label: 'Disk %', data: [latest?.disk ?? 0], color: METRIC_COLORS.disk },
      ],
    };
  }, [latest, scenario, fetchError]);

  const barData: ChartData = useMemo(() => {
    if (scenario === 'malformed') {
      return malformedBarData;
    }
    if (scenario === 'normal' && fetchError) {
      return { title: 'Current resource comparison', labels: [], series: [] };
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
  }, [latest, scenario, fetchError]);

  const gaugeData: ChartData = useMemo(() => {
    if (scenario === 'malformed') {
      return malformedGaugeData;
    }
    if (scenario === 'normal' && fetchError) {
      return { title: 'Gauges', gauges: [] };
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
  }, [latest, scenario, fetchError]);

  const chartsLoading = scenario === 'loading' || (scenario === 'normal' && !latest && !fetchError);

  const barLoading = scenario === 'loading' || (scenario === 'normal' && !latest && !fetchError);

  return (
    <Box sx={{ py: 3, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            System Monitoring Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live metrics from the local WebSocket server. Switch scenarios to validate loading and error handling
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
              Connection error: {fetchError} (is the backend running and the websocket port configured correctly?)
            </Typography>
          ) : null}
        </Stack>

        <Stack spacing={3}>
          <Paper sx={{ p: 2 }}>
            <LineChart
              data={lineData}
              loading={chartsLoading}
              height={340}
              yAxisMin={0}
              yAxisMax={100}
              historyCount={LINE_HISTORY_COUNT}
            />
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
