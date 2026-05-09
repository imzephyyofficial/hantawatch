// Tiny forecasting: linear regression on the last N points, project K weeks forward.
// Clearly model output — surfaced as such in the UI.

export interface ForecastResult {
  history: number[];
  forecast: number[];
  trendPerWeek: number;
  rSquared: number;
}

function linearRegression(y: number[]): { slope: number; intercept: number; r2: number } {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0, r2: 0 };
  const x = y.map((_, i) => i);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY);
    den += (x[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yi = slope * x[i] + intercept;
    ssRes += (y[i] - yi) ** 2;
    ssTot += (y[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

export function forecast(series: number[], weeksAhead = 4): ForecastResult {
  const { slope, intercept, r2 } = linearRegression(series);
  const forecast: number[] = [];
  for (let i = 0; i < weeksAhead; i++) {
    const x = series.length + i;
    forecast.push(Math.max(0, Math.round(slope * x + intercept)));
  }
  return {
    history: series.slice(),
    forecast,
    trendPerWeek: Math.round(slope * 10) / 10,
    rSquared: Math.round(r2 * 100) / 100,
  };
}
