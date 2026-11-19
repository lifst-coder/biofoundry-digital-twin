export type ProcessStage =
  | '준비'
  | '시작'
  | '배양'
  | '모니터링'
  | '수확'
  | '종료'
  | '기록검토';

export interface SimulationParams {
  temperature: number; // °C
  ph: number;
  dissolvedOxygen: number; // %
  agitationSpeed: number; // RPM
  initialBiomass: number; // g/L
  initialSubstrate: number; // g/L
  muMax: number; // 1/h
  ks: number; // g/L
  yxs: number; // g/g
  ypx: number; // g/g
  cultureDuration: number; // hours
}

export interface SensorReading {
  time: number; // hours
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  agitationSpeed: number;
  biomass: number;
  substrate: number;
  product: number;
}

export interface BatchRecord {
  id: string;
  name: string;
  startTime: string;
  currentStage: ProcessStage;
  params: SimulationParams;
  history: SensorReading[];
  logs: { time: string; event: string; details?: string }[];
  qualityCriteria: {
    minBiomass: number;
    maxPhDeviation: number;
    minDo: number;
  };
  isSimulated: boolean;
  source: 'simulation' | 'upload';
}

export const DEFAULT_PARAMS: SimulationParams = {
  temperature: 30,
  ph: 6.5,
  dissolvedOxygen: 40,
  agitationSpeed: 200,
  initialBiomass: 0.1,
  initialSubstrate: 20,
  muMax: 0.4,
  ks: 0.5,
  yxs: 0.5,
  ypx: 0.3,
  cultureDuration: 24,
};

export const STAGE_ORDER: ProcessStage[] = [
  '준비',
  '시작',
  '배양',
  '모니터링',
  '수확',
  '종료',
  '기록검토',
];
