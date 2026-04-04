import { Box, Typography } from '@mui/material';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import type { ChartData } from './types';
import { validateLineOrBarData } from './validation';
import { ChartStatus } from './ChartStatus';

export interface LineChartProps {
  data: ChartData;
  /** Pixel height of the chart area. */
  height?: number;
  loading?: boolean;
}

export function LineChart({ data, height = 320, loading = false }: LineChartProps) {
  const [containerRef, width] = useResponsiveChartWidth();
  const validation = validateLineOrBarData(data);

  if (loading) {
    return (
      <Box ref={containerRef} sx={{ width: '100%' }}>
        <ChartStatus severity="info" message="Loading chart data…" />
      </Box>
    );
  }

  if (!validation.ok) {
    return (
      <Box ref={containerRef} sx={{ width: '100%' }}>
        <ChartStatus message={validation.message} />
      </Box>
    );
  }

  const { series, labels, title } = data;
  const xAxisData =
    labels?.map((l) => (typeof l === 'number' ? l : String(l))) ??
    series![0].data.map((_, i) => i);

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      {title ? (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
      ) : null}
      <MuiLineChart
        height={height}
        xAxis={[{ scaleType: 'point', data: xAxisData }]}
        series={series!.map((s) => ({
          id: s.id ?? s.label,
          label: s.label,
          data: s.data,
          color: s.color,
          showMark: true,
        }))}
      />
    </Box>
  );
}
