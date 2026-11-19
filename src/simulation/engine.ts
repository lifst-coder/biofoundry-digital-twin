import type { SimulationParams, SensorReading } from './types';

/**
 * Educational batch Monod model for a non-pathogenic culture (yeast-like).
 * Limitations: not for real process prediction. No inhibition, maintenance, death phase,
 * diauxie or mass-transfer limits. Deterministic: same params give the same series.
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

/** Monod substrate limitation, 0..1. */
export function substrateFactor(S: number, ks: number): number {
  if (S <= 0) return 0;
  return S / (Math.max(ks, 1e-9) + S);
}

/**
 * Batch Monod kinetics, integrated with fixed-step RK4.
 *   dX/dt = mu_env * S / (Ks + S) * X
 *   dS/dt = -(1 / Yxs) * dX/dt
 *   P     = Ypx * (X - X0)            (growth-associated product)
 * X + Yxs * S is conserved, so biomass can never exceed X0 + Yxs * S0.
 */
export function simulateTimeSeries(params: SimulationParams, stepHours = 0.5): SensorReading[] {
  const muEnv = computeGrowthRate(params);
  const { initialBiomass, initialSubstrate, ks, ypx, cultureDuration } = params;
  const X0 = Math.max(0, initialBiomass);
  const S0 = Math.max(0, initialSubstrate);
  const yxs = Math.max(params.yxs, 1e-9);
  const step = stepHours > 0 ? stepHours : 0.5;
  const steps = Math.max(0, Math.floor(cultureDuration / step + 1e-9));
  const total = X0 + yxs * S0;
  const SUBSTEPS = 10;
  const h = step / SUBSTEPS;
  const dX = (X: number) => muEnv * substrateFactor((total - X) / yxs, ks) * X;

  const readings: SensorReading[] = [];
  let X = X0;
  for (let i = 0; i <= steps; i += 1) {
    const t = i * step;
    const S = Math.max(0, (total - X) / yxs);
    readings.push({
      time: Number(t.toFixed(2)),
      temperature: params.temperature + Math.sin(t / 5) * 0.2, // deterministic ripple, not noise
      ph: params.ph - (X - X0) * 0.01,
      dissolvedOxygen: params.dissolvedOxygen * (1 - (X / (total + 1)) * 0.3),
      agitationSpeed: params.agitationSpeed,
      biomass: Number(X.toFixed(3)),
      substrate: Number(S.toFixed(3)),
      product: Number(Math.max(0, (X - X0) * ypx).toFixed(3)),
    });
    for (let j = 0; j < SUBSTEPS; j += 1) {
      const k1 = dX(X);
      const k2 = dX(X + (h / 2) * k1);
      const k3 = dX(X + (h / 2) * k2);
      const k4 = dX(X + h * k3);
      X = Math.min(total, X + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
    }
  }
  return readings;
}

/** Reading at or just before `elapsedHours`. Pass an existing series to avoid recomputing it. */
export function getCurrentState(
  params: SimulationParams,
  elapsedHours: number,
  series: SensorReading[] = simulateTimeSeries(params),
): SensorReading {
  let hit = series[0];
  for (const reading of series) {
    if (reading.time > elapsedHours) break;
    hit = reading;
  }
  return hit;
}

export const MODEL_FORMULAS = `
교육용 단순화 Monod 모델 (비병원성 배양 가정):

μ = μ_max × f(T) × f(pH) × f(DO) × f(RPM) × S / (Ks + S)

f(T) = exp(-0.5 * ((T - 30)/5)^2)
f(pH) = exp(-0.5 * ((pH - 6.5)/0.8)^2)
f(DO) = min(1, DO/40)
f(RPM) = 1 (50~500), else reduced

dX/dt = μ × X
dS/dt = -(1 / Y_{X/S}) × dX/dt
P = Y_{P/X} × (X - X0)

수치 적분: 고정 간격 RK4. X + Y_{X/S} × S 는 보존됩니다.

한계: 실제 공정 예측 불가. 억제, 다상, 물질전달, 오염 등 미반영.
`.trim();
