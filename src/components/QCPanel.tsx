import { useProcessStore } from '../store/useProcessStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function QCPanel() {
  const batches = useProcessStore((s) => s.batches);
  const current = useProcessStore((s) => s.getCurrentBatch());

  if (!current) return <div className="p-6">배치 선택 필요</div>;

  const last = current.history[current.history.length - 1];
  const issues: string[] = [];
  if (last) {
    if (last.biomass < current.qualityCriteria.minBiomass) issues.push(`생체량 부족 (${last.biomass} < ${current.qualityCriteria.minBiomass})`);
    if (Math.abs(last.ph - current.params.ph) > current.qualityCriteria.maxPhDeviation) issues.push('pH 편차 초과');
    if (last.dissolvedOxygen < current.qualityCriteria.minDo) issues.push('DO 부족');
  }

  // Simple integrity: check monotonic time
  const integrityOk = current.history.every((r, i, arr) => i === 0 || r.time >= arr[i - 1].time);

  const comparison = batches.slice(0, 5).map((b) => ({
    name: b.name.slice(0, 8),
    biomass: b.history[b.history.length - 1]?.biomass || 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">품질관리 · 교육용 가상 기준</h2>
      <div className="flex items-center gap-2">
        {issues.length === 0 && integrityOk ? (
          <CheckCircle className="text-green-500" />
        ) : (
          <AlertTriangle className="text-amber-500" />
        )}
        <span>{issues.length === 0 && integrityOk ? '기준 충족' : '이상 감지'}</span>
      </div>
      <ul className="text-sm text-amber-300">
        {issues.map((i, idx) => <li key={idx}>• {i}</li>)}
        {!integrityOk && <li>• 센서 데이터 시간 순서 이상</li>}
      </ul>

      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={comparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="biomass" name="최종 생체량" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-slate-500">
        배치 기록 조회 · 공정 변수 차트 · 가상 품질 기준 · 이상값 · 무결성 · 배치 비교 · 변경 이력 (로그) · 보고서 내보내기 지원.
        <br />※ 본 시스템은 교육용 설계이며 GMP 인증 제품이 아닙니다.
      </div>
    </div>
  );
}
