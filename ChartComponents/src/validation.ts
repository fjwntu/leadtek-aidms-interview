import type { ChartData, ChartValidationResult } from './types';

function isNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

export function validateLineOrBarData(data: ChartData | undefined): ChartValidationResult {
  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'Chart data is missing or not an object.' };
  }
  const { series, labels } = data;
  if (!Array.isArray(series) || series.length === 0) {
    return { ok: false, message: 'Provide at least one series with numeric data.' };
  }
  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    if (!s || typeof s !== 'object') {
      return { ok: false, message: `Series at index ${i} is invalid.` };
    }
    if (typeof s.label !== 'string' || !s.label.trim()) {
      return { ok: false, message: `Series at index ${i} needs a non-empty label.` };
    }
    if (!Array.isArray(s.data)) {
      return { ok: false, message: `Series "${s.label}" must include a data array.` };
    }
    for (let j = 0; j < s.data.length; j++) {
      if (!isNumber(s.data[j])) {
        return { ok: false, message: `Series "${s.label}" contains a non-numeric value at position ${j}.` };
      }
    }
  }
  const firstLen = series[0].data.length;
  if (firstLen === 0) {
    return { ok: false, message: 'Series data cannot be empty.' };
  }
  for (let i = 1; i < series.length; i++) {
    if (series[i].data.length !== firstLen) {
      return { ok: false, message: 'All series must have the same number of points.' };
    }
  }
  if (labels !== undefined) {
    if (!Array.isArray(labels) || labels.length !== firstLen) {
      return { ok: false, message: 'Labels must match the number of data points in each series.' };
    }
  }
  return { ok: true };
}

export function validateGaugeData(data: ChartData | undefined): ChartValidationResult {
  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'Chart data is missing or not an object.' };
  }
  if (data.gauges !== undefined) {
    if (!Array.isArray(data.gauges) || data.gauges.length === 0) {
      return { ok: false, message: 'Gauge collection must include at least one gauge item.' };
    }
    for (let i = 0; i < data.gauges.length; i++) {
      const gauge = data.gauges[i];
      if (!gauge || typeof gauge !== 'object') {
        return { ok: false, message: `Gauge at index ${i} is invalid.` };
      }
      if (!isNumber(gauge.value)) {
        return { ok: false, message: `Gauge at index ${i} requires a finite numeric \`value\`.` };
      }
    }
    return { ok: true };
  }
  if (!isNumber(data.value)) {
    return { ok: false, message: 'Gauge requires a finite numeric `value`.' };
  }
  return { ok: true };
}
