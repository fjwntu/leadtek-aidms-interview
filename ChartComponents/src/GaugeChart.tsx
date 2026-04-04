import { Box, Stack, Typography } from '@mui/material';
import { Gauge } from '@mui/x-charts/Gauge';
import type { ChartData, GaugeItem } from './types';
import { validateGaugeData } from './validation';
import { ChartStatus } from './ChartStatus';

export interface GaugeChartProps {
  data: ChartData;
  /** Outer diameter relative to container (clamped for readability). */
  height?: number;
  valueMin?: number;
  valueMax?: number;
  loading?: boolean;
}

interface GaugeCardProps {
  gauge: GaugeItem;
  height: number;
  valueMin: number;
  valueMax: number;
}

function GaugeCard({ gauge, height, valueMin, valueMax }: GaugeCardProps) {
  const { title, gaugeLabel, value, color, trackColor } = gauge;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {title ? (
        <Typography align="center" variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
      ) : null}
      <Gauge
        width={Math.min(height, 320)}
        height={height}
        value={value}
        valueMin={valueMin}
        valueMax={valueMax}
        startAngle={-110}
        endAngle={110}
        innerRadius="72%"
        outerRadius="100%"
        text={({ value: v }) => (v == null ? '' : `${Math.round(v)}%`)}
        sx={{
          ...(color
            ? {
                '& .MuiGauge-valueArc': {
                  fill: color,
                },
                '& .MuiGauge-valueText': {
                  fill: color,
                },
              }
            : {}),
          ...(trackColor
            ? {
                '& .MuiGauge-referenceArc': {
                  fill: trackColor,
                },
              }
            : {}),
        }}
      />
      {gaugeLabel ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {gaugeLabel}
        </Typography>
      ) : null}
    </Box>
  );
}

export function GaugeChart({
  data,
  height = 280,
  valueMin = 0,
  valueMax = 100,
  loading = false,
}: GaugeChartProps) {
  const validation = validateGaugeData(data);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <ChartStatus severity="info" message="Loading gauge data…" />
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

  const gauges = data.gauges ?? [data as GaugeItem];

  return (
    <Box sx={{ width: '100%' }}>
      {data.title ? (
        <Typography align="center" variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {data.title}
        </Typography>
      ) : null}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-around"
        alignItems="center"
        flexWrap="wrap"
      >
        {gauges.map((gauge, index) => (
          <GaugeCard
            key={`${gauge.title ?? gauge.gaugeLabel ?? 'gauge'}-${index}`}
            gauge={gauge}
            height={height}
            valueMin={valueMin}
            valueMax={valueMax}
          />
        ))}
      </Stack>
    </Box>
  );
}
