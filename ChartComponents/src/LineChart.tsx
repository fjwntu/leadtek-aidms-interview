import { Box, Typography } from '@mui/material';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import { useEffect, useMemo, useState } from 'react';
import type { ChartData } from './types';
import { validateLineOrBarData } from './validation';
import { ChartStatus } from './ChartStatus';

export interface LineChartProps {
  data: ChartData;
  /** Pixel height of the chart area. */
  height?: number;
  loading?: boolean;
  yAxisMin?: number;
  yAxisMax?: number;
  historyCount?: number;
}

const DEFAULT_HISTORY_COUNT = 20;

interface SeriesMeta {
  id: string;
  label: string;
  color?: string;
}

interface HistoryPoint {
  label: string | number;
  values: number[];
}

export function LineChart({
  data,
  height = 320,
  loading = false,
  yAxisMin,
  yAxisMax,
  historyCount = DEFAULT_HISTORY_COUNT,
}: LineChartProps) {
  const maxHistoryCount = Number.isFinite(historyCount) && historyCount > 0
    ? Math.floor(historyCount)
    : DEFAULT_HISTORY_COUNT;
  const [seriesMeta, setSeriesMeta] = useState<SeriesMeta[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const validation = validateLineOrBarData(data);
  const isDataValid = validation.ok;
  const inputSeries = isDataValid ? data.series ?? [] : [];
  const title = isDataValid ? data.title : undefined;
  const activeSeries = seriesMeta.length
    ? seriesMeta
    : inputSeries.map((s) => ({
        id: s.id ?? s.label,
        label: s.label,
        color: s.color,
      }));

  const { xAxisData, seriesData } = useMemo(() => {
    const xAxisLabels = history.map((item) =>
      typeof item.label === 'number' ? new Date(item.label).toLocaleTimeString() : String(item.label)
    );
    const datasets = activeSeries.map((_, seriesIndex) =>
      history.map((item) => {
        const value = item.values[seriesIndex];
        return Number.isFinite(value) ? value : null;
      })
    );

    return { xAxisData: xAxisLabels, seriesData: datasets };
  }, [activeSeries, history]);

  useEffect(() => {
    if (loading || !isDataValid) {
      return;
    }

    const latestLabel = data.labels?.[data.labels.length - 1] ?? Date.now();
    const values = inputSeries.length
      ? inputSeries.map((s) => s.data[s.data.length - 1] ?? 0)
      : seriesMeta.map(() => 0);

    if (seriesMeta.length === 0 && inputSeries.length > 0) {
      setSeriesMeta(
        inputSeries.map((s) => ({
          id: s.id ?? s.label,
          label: s.label,
          color: s.color,
        }))
      );
    }

    setHistory((prev) => {
      const next = [...prev, { label: latestLabel, values }];
      return next.length > maxHistoryCount ? next.slice(-maxHistoryCount) : next;
    });
  }, [data.labels, inputSeries, loading, isDataValid, maxHistoryCount, seriesMeta.length]);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <ChartStatus severity="info" message="Loading chart data…" />
      </Box>
    );
  }

  if (!validation.ok) {
    return (
      <Box sx={{ width: '100%' }}>
        <ChartStatus message={validation.message} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {title ? (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
      ) : null}
      <MuiLineChart
        skipAnimation
        height={height}
        xAxis={[{ scaleType: 'point', data: xAxisData }]}
        yAxis={[{ min: yAxisMin, max: yAxisMax }]}
        series={activeSeries.map((s, index) => ({
          id: s.id,
          label: s.label,
          data: seriesData[index],
          color: s.color,
          showMark: false,
        }))}
      />
    </Box>
  );
}
