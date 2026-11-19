import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeGrowthRate, getCurrentState, simulateTimeSeries, substrateFactor } from '../src/simulation/engine.ts';
import { DEFAULT_PARAMS } from '../src/simulation/types.ts';

describe('growth rate', () => {
  it('equals muMax at optimal conditions', () => {
    assert.ok(Math.abs(computeGrowthRate(DEFAULT_PARAMS) - DEFAULT_PARAMS.muMax) < 1e-12);
  });

  it('falls away from the optimum and never goes negative', () => {
    const cold = computeGrowthRate({ ...DEFAULT_PARAMS, temperature: 15 });
    const acid = computeGrowthRate({ ...DEFAULT_PARAMS, ph: 4 });
    const anoxic = computeGrowthRate({ ...DEFAULT_PARAMS, dissolvedOxygen: 0 });
    assert.ok(cold < DEFAULT_PARAMS.muMax * 0.05);
    assert.ok(acid < DEFAULT_PARAMS.muMax * 0.05);
    assert.equal(anoxic, 0);
  });

  it('is half of maximum when S equals Ks', () => {
    assert.equal(substrateFactor(0.5, 0.5), 0.5);
    assert.equal(substrateFactor(0, 0.5), 0);
  });
});

describe('batch simulation', () => {
  const series = simulateTimeSeries(DEFAULT_PARAMS);
  const { initialBiomass: X0, initialSubstrate: S0, yxs, ypx } = DEFAULT_PARAMS;

  it('starts at the initial state and covers the whole run', () => {
    assert.equal(series.length, 49);
    assert.equal(series[0].biomass, X0);
    assert.equal(series[0].substrate, S0);
    assert.equal(series.at(-1)?.time, DEFAULT_PARAMS.cultureDuration);
  });

  it('conserves mass: X + Yxs * S stays constant', () => {
    for (const r of series) {
      assert.ok(Math.abs(r.biomass + yxs * r.substrate - (X0 + yxs * S0)) < 2e-3, `t=${r.time}`);
    }
  });

  it('grows monotonically and plateaus at X0 + Yxs * S0', () => {
    for (let i = 1; i < series.length; i += 1) assert.ok(series[i].biomass >= series[i - 1].biomass);
    const last = series.at(-1)!;
    assert.ok(Math.abs(last.biomass - (X0 + yxs * S0)) < 0.01);
    assert.ok(last.substrate < 0.01);
    assert.ok(Math.abs(last.product - (last.biomass - X0) * ypx) < 2e-3);
  });

  it('is close to exponential while substrate is far above Ks', () => {
    const at4h = series.find((r) => r.time === 4)!;
    const exponential = X0 * Math.exp(DEFAULT_PARAMS.muMax * 4);
    assert.ok(at4h.biomass < exponential);
    assert.ok(at4h.biomass > exponential * 0.95);
  });

  it('slows down as Ks rises', () => {
    const slow = simulateTimeSeries({ ...DEFAULT_PARAMS, ks: 10 });
    assert.ok(slow[20].biomass < series[20].biomass);
  });

  it('does not depend on the output step', () => {
    const fine = simulateTimeSeries(DEFAULT_PARAMS, 0.1);
    const coarse12 = series.find((r) => r.time === 12)!;
    const fine12 = fine.find((r) => r.time === 12)!;
    assert.ok(Math.abs(coarse12.biomass - fine12.biomass) < 5e-3);
  });

  it('handles degenerate input', () => {
    assert.equal(simulateTimeSeries({ ...DEFAULT_PARAMS, initialSubstrate: 0 }).at(-1)?.biomass, X0);
    assert.equal(simulateTimeSeries({ ...DEFAULT_PARAMS, initialBiomass: 0 }).at(-1)?.biomass, 0);
    assert.equal(simulateTimeSeries({ ...DEFAULT_PARAMS, cultureDuration: 0 }).length, 1);
    assert.ok(simulateTimeSeries({ ...DEFAULT_PARAMS, initialBiomass: -5 }).every((r) => r.biomass >= 0));
  });

  it('getCurrentState returns the reading at or before the requested time', () => {
    assert.equal(getCurrentState(DEFAULT_PARAMS, 3.3, series).time, 3);
    assert.equal(getCurrentState(DEFAULT_PARAMS, 999, series).time, 24);
    assert.equal(getCurrentState(DEFAULT_PARAMS, -1, series).time, 0);
  });
});
