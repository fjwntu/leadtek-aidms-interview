/**
 * Shared chart data contract for Line and Bar charts.
 * Each series must have the same length as `labels` when labels are provided.
 */
export interface ChartSeries {
  id?: string;
  label: string;
  data: number[];
  color?: string;
}

export interface GaugeItem {
  /** Human-readable gauge title (optional). */
  title?: string;
  /** Gauge value (typically 0–100). */
  value: number;
  /** Optional gauge caption. */
  gaugeLabel?: string;
  /** Optional primary color for single-value charts such as gauges. */
  color?: string;
  /** Optional secondary color for the remaining gauge arc. */
  trackColor?: string;
}

export interface ChartData {
  /** Human-readable chart title (optional). */
  title?: string;
  /** Categories or time labels shared across series. */
  labels?: (string | number)[];
  /** One or more numeric series (line / grouped bar). */
  series?: ChartSeries[];
  /** Gauge value (typically 0–100). */
  value?: number;
  /** Optional gauge caption. */
  gaugeLabel?: string;
  /** Optional primary color for single-value charts such as gauges. */
  color?: string;
  /** Optional secondary color for the remaining gauge arc. */
  trackColor?: string;
  /** Optional collection of gauges rendered together. */
  gauges?: GaugeItem[];
}

export type ChartValidationResult =
  | { ok: true }
  | { ok: false; message: string };
