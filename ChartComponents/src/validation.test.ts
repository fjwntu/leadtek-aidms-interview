import { describe, expect, it } from 'vitest';
import { validateGaugeData, validateLineOrBarData } from './validation';

describe('validateLineOrBarData', () => {
  it('accepts valid line/bar data', () => {
    const result = validateLineOrBarData({
      labels: ['a', 'b', 'c'],
      series: [
        { label: 'CPU %', data: [10, 20, 30] },
        { label: 'Memory %', data: [15, 25, 35] },
      ],
    });

    expect(result).toEqual({ ok: true });
  });

  it('rejects mismatched labels length', () => {
    const result = validateLineOrBarData({
      labels: ['a', 'b'],
      series: [{ label: 'CPU %', data: [10, 20, 30] }],
    });

    expect(result.ok).toBe(false);
    expect(result).toEqual({
      ok: false,
      message: 'Labels must match the number of data points in each series.',
    });
  });

  it('rejects non-numeric values', () => {
    const result = validateLineOrBarData({
      series: [{ label: 'CPU %', data: [10, Number.NaN, 30] }],
    });

    expect(result.ok).toBe(false);
    expect(result).toEqual({
      ok: false,
      message: 'Series "CPU %" contains a non-numeric value at position 1.',
    });
  });
});

describe('validateGaugeData', () => {
  it('accepts a single gauge value', () => {
    const result = validateGaugeData({ value: 72 });

    expect(result).toEqual({ ok: true });
  });

  it('accepts a multi-gauge payload', () => {
    const result = validateGaugeData({
      gauges: [
        { title: 'CPU', value: 72 },
        { title: 'Memory', value: 55 },
      ],
    });

    expect(result).toEqual({ ok: true });
  });

  it('rejects empty gauge arrays', () => {
    const result = validateGaugeData({ gauges: [] });

    expect(result.ok).toBe(false);
    expect(result).toEqual({
      ok: false,
      message: 'Gauge collection must include at least one gauge item.',
    });
  });

  it('rejects invalid gauge item values', () => {
    const result = validateGaugeData({
      gauges: [{ title: 'CPU', value: Number.NaN }],
    });

    expect(result.ok).toBe(false);
    expect(result).toEqual({
      ok: false,
      message: 'Gauge at index 0 requires a finite numeric `value`.',
    });
  });
});
