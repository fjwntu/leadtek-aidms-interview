import { Box, Typography } from '@mui/material';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import type { ChartData } from './types';
import { validateLineOrBarData } from './validation';
import { ChartStatus } from './ChartStatus';

export interface BarChartProps {
  data: ChartData;
  height?: number;
  loading?: boolean;
}

export function BarChart({ data, height = 320, loading = false }: BarChartProps) {
  // const [containerRef, width] = useResponsiveChartWidth();
  const validation = validateLineOrBarData(data);

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

  const { series, labels, title } = data;
  const xAxisData =
    labels?.map((l) => (typeof l === 'number' ? l : String(l))) ??
    series![0].data.map((_, i) => `Item ${i + 1}`);

  return (
    <Box sx={{ width: '100%' }}>
      {title ? (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
      ) : null}
      <MuiBarChart
        // width={}
        height={height}
        xAxis={[{ scaleType: 'band', data: xAxisData }]}
        series={series!.map((s) => ({
          id: s.id ?? s.label,
          label: s.label,
          data: s.data,
          color: s.color,
        }))}
      />
    </Box>
  );
}
