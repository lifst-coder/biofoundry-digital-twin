import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BatchRecord, ProcessStage, SimulationParams } from '../simulation/types';
import { DEFAULT_PARAMS, STAGE_ORDER } from '../simulation/types';
import { simulateTimeSeries } from '../simulation/engine';

interface ProcessState {
  batches: BatchRecord[];
  currentBatchId: string | null;
  selectedZone: string | null;
  addBatch: (name: string, params?: Partial<SimulationParams>) => string;
  updateStage: (batchId: string, stage: ProcessStage) => void;
  updateParams: (batchId: string, params: Partial<SimulationParams>) => void;
  runSimulation: (batchId: string) => void;
  addLog: (batchId: string, event: string, details?: string) => void;
  importBatches: (data: BatchRecord[]) => void;
  setZone: (zone: string | null) => void;
  getCurrentBatch: () => BatchRecord | null;
}

const generateId = () => `BF-${Date.now().toString(36).toUpperCase()}`;

export const useProcessStore = create<ProcessState>()(
  persist(
    (set, get) => ({
      batches: [],
      currentBatchId: null,
      selectedZone: null,

      addBatch: (name, params = {}) => {
        const id = generateId();
        const fullParams = { ...DEFAULT_PARAMS, ...params };
        const batch: BatchRecord = {
          id,
          name,
          startTime: new Date().toISOString(),
          currentStage: '준비',
          params: fullParams,
          history: [],
          logs: [{ time: new Date().toISOString(), event: '배치 생성', details: name }],
          qualityCriteria: { minBiomass: 2, maxPhDeviation: 0.5, minDo: 20 },
          isSimulated: true,
          source: 'simulation',
        };
        set((s) => ({ batches: [...s.batches, batch], currentBatchId: id }));
        return id;
      },

      updateStage: (batchId, stage) => {
        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId
              ? {
                  ...b,
                  currentStage: stage,
                  logs: [...b.logs, { time: new Date().toISOString(), event: `단계 변경: ${stage}` }],
                }
              : b
          ),
        }));
      },

      updateParams: (batchId, params) => {
        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId
              ? {
                  ...b,
                  params: { ...b.params, ...params },
                  logs: [...b.logs, { time: new Date().toISOString(), event: '파라미터 변경', details: JSON.stringify(params) }],
                }
              : b
          ),
        }));
      },

      runSimulation: (batchId) => {
        const batch = get().batches.find((b) => b.id === batchId);
        if (!batch) return;
        const history = simulateTimeSeries(batch.params);
        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId
              ? {
                  ...b,
                  history,
                  currentStage: '배양',
                  logs: [...b.logs, { time: new Date().toISOString(), event: '시뮬레이션 실행', details: `${history.length} 포인트` }],
                }
              : b
          ),
        }));
      },

      addLog: (batchId, event, details) => {
        set((s) => ({
          batches: s.batches.map((b) =>
            b.id === batchId
              ? { ...b, logs: [...b.logs, { time: new Date().toISOString(), event, details }] }
              : b
          ),
        }));
      },

      importBatches: (data) => {
        set((s) => ({
          batches: [...s.batches, ...data.map((d) => ({ ...d, source: 'upload' as const, isSimulated: false }))],
        }));
      },

      setZone: (zone) => set({ selectedZone: zone }),

      getCurrentBatch: () => {
        const { batches, currentBatchId } = get();
        return batches.find((b) => b.id === currentBatchId) || null;
      },
    }),
    { name: 'biofoundry-store' }
  )
);

export { STAGE_ORDER };
