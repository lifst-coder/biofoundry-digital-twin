import type { SimulationParams, SensorReading } from './types';

/**
 * Simplified educational Monod-based growth model for non-pathogenic culture (e.g. yeast).
 * Limitations: Not for real process prediction. Ignores inhibition, multi-phase, mass transfer details.
 * Deterministic: pure function of params + elapsed hours.
 */

function tempFactor(T: number): number {
  // Optimal ~30°C for yeast-like
  const opt = 30;
  const sigma = 5;
  return Math.exp(-0.5 * Math.pow((T - opt) / sigma, 2));
}

function phFactor(pH: number): number {
  const opt = 6.5;
  const sigma = 0.8;
  return Math.exp(-0.5 * Math.pow((pH - opt) / sigma, 2));
}

function doFactor(DO: number): number {
  // Saturation above 30%
  return Math.min(1, DO / 40);
}

function agitationFactor(RPM: number): number {
  // Mild effect, optimal 150-300
  if (RPM < 50) return 0.3;
  if (RPM > 500) return 0.7;
  return 1;
}

export function computeGrowthRate(params: SimulationParams): number {
  const { temperature, ph, dissolvedOxygen, agitationSpeed, muMax } = params;
  const base = muMax * tempFactor(temperature) * phFactor(ph) * doFactor(dissolvedOxygen) * agitationFactor(agitationSpeed);
  return Math.max(0, base);
}

/**
 * Integrate simple batch kinetics over time.
 * Uses analytical approximation for Monod in batch (approx exponential then linear).
 */
export function simulateTimeSeries(params: SimulationParams, stepHours = 0.5): SensorReading[] {
  const readings: SensorReading[] = [];
  const mu = computeGrowthRate(params);
  const { initialBiomass: X0, initialSubstrate: S0, yxs, ypx, cultureDuration } = params;

  for (let t = 0; t <= cultureDuration; t += stepHours) {
    // Simplified: exponential growth limited by substrate
    // X = X0 * exp(mu * t) until substrate depletes
    const potentialX = X0 * Math.exp(mu * t);
    const consumedS = (potentialX - X0) / yxs;
    const S = Math.max(0, S0 - consumedS);
    const X = S > 0 ? potentialX : X0 + S0 * yxs;
    const P = (X - X0) * ypx;

    readings.push({
      time: Number(t.toFixed(2)),
      temperature: params.temperature + (Math.sin(t / 5) * 0.2), // small noise for realism, but deterministic
      ph: params.ph - (X - X0) * 0.01, // slight drop
      dissolvedOxygen: params.dissolvedOxygen * (1 - X / (X0 + S0 * yxs + 1) * 0.3),
      agitationSpeed: params.agitationSpeed,
      biomass: Number(Math.max(0, X).toFixed(3)),
      substrate: Number(Math.max(0, S).toFixed(3)),
      product: Number(Math.max(0, P).toFixed(3)),
    });
  }
  return readings;
}

export function getCurrentState(params: SimulationParams, elapsedHours: number): SensorReading {
  const series = simulateTimeSeries(params, 0.1);
  const idx = Math.min(series.length - 1, Math.floor(elapsedHours / 0.1));
  return series[idx] || series[0];
}

export const MODEL_FORMULAS = `
교육용 단순화 Monod 모델 (비병원성 배양 가정):

μ = μ_max × f(T) × f(pH) × f(DO) × f(RPM)

f(T) = exp(-0.5 * ((T - 30)/5)^2)
f(pH) = exp(-0.5 * ((pH - 6.5)/0.8)^2)
f(DO) = min(1, DO/40)
f(RPM) = 1 (50~500), else reduced

dX/dt ≈ μ * X (기질 제한 시 포화)
dS/dt ≈ -(μ / Y_{X/S}) * X
dP/dt ≈ Y_{P/X} * μ * X

한계: 실제 공정 예측 불가. 억제, 다상, 물질전달, 오염 등 미반영.
`.trim();
