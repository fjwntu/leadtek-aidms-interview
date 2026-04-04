# @leadtek/chart-components

Reusable React chart components built with MUI and MUI X Charts.

This package exposes three components:
- `LineChart`
- `BarChart`
- `GaugeChart`

## Installation

Install the package together with its peer dependencies:

```bash
npm install @leadtek/chart-components @mui/material @mui/x-charts @emotion/react @emotion/styled react react-dom
```

For this repository, the demo app uses the local package through:

```json
{
	"dependencies": {
		"@leadtek/chart-components": "file:../ChartComponents"
	}
}
```

## Exports

The package exports:

- `LineChart`
- `BarChart`
- `GaugeChart`
- `ChartData`
- `ChartSeries`
- `GaugeItem`

## Shared types

### `ChartSeries`

Used by line and bar charts.

```ts
interface ChartSeries {
	id?: string;
	label: string;
	data: number[];
	color?: string;
}
```

### `GaugeItem`

Used by multi-gauge rendering.

```ts
interface GaugeItem {
	title?: string;
	value: number;
	gaugeLabel?: string;
	color?: string;
	trackColor?: string;
}
```

### `ChartData`

Main data contract for all chart components.

```ts
interface ChartData {
	title?: string;
	labels?: (string | number)[];
	series?: ChartSeries[];
	value?: number;
	gaugeLabel?: string;
	color?: string;
	trackColor?: string;
	gauges?: GaugeItem[];
}
```

## Single gauge usage

`GaugeChart` also supports a single gauge data shape.

```tsx
import { GaugeChart, type ChartData } from '@leadtek/chart-components';

const cpuGauge: ChartData = {
	title: 'CPU',
	value: 41,
	gaugeLabel: 'Processor usage',
	color: '#1976d2',
	trackColor: '#d7e8fb',
};

export function CpuGauge() {
	return <GaugeChart data={cpuGauge} />;
}
```

## Loading state

All chart components support a `loading` prop.

```tsx
<LineChart data={lineData} loading />
<BarChart data={barData} loading />
<GaugeChart data={gaugeData} loading />
```

## Validation behavior

The components perform basic in-component validation and show a friendly status message when data is invalid.

Examples of invalid input:
- empty `series`
- non-numeric values in `series.data`
- `labels.length` not matching series length
- missing or invalid gauge `value`
- empty `gauges` arrays

## Component props

### `LineChart`

```ts
interface LineChartProps {
	data: ChartData;
	height?: number;
	loading?: boolean;
}
```

### `BarChart`

```ts
interface BarChartProps {
	data: ChartData;
	height?: number;
	loading?: boolean;
}
```

### `GaugeChart`

```ts
interface GaugeChartProps {
	data: ChartData;
	height?: number;
	valueMin?: number;
	valueMax?: number;
	loading?: boolean;
}
```