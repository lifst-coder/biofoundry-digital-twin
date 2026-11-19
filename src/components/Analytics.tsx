import { useProcessStore } from '../store/useProcessStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const batches = useProcessStore((s) => s.batches);

  const growthData = batches[0]?.history || [];

  // Simple stats
  const biomasses = batches.flatMap((b) => b.history.map((h) => h.biomass));
  const mean = biomasses.length ? biomasses.reduce((a, b) => a + b, 0) / biomasses.length : 0;
  const max = Math.max(...biomasses, 0);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">고급 분석</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-900 p-4 rounded">평균 생체량<br /><span className="text-2xl">{mean.toFixed(2)}</span></div>
        <div className="bg-slate-900 p-4 rounded">최대 생체량<br /><span className="text-2xl">{max.toFixed(2)}</span></div>
        <div className="bg-slate-900 p-4 rounded">배치 수<br /><span className="text-2xl">{batches.length}</span></div>
      </div>
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line dataKey="biomass" stroke="#22c55e" name="성장곡선" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500">
        성장곡선 · 공정 변수 시계열 · 단순 수율 모델 · 배치별 편차 · 조건 간 비교 · 이상 탐지 · 기초 통계 · 공정 상태 대시보드.
        <br />실제 분석 모델과 예시 그래프를 구분하여 표시합니다.
      </p>
    </div>
  );
}
