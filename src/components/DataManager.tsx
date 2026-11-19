import { useProcessStore } from '../store/useProcessStore';
import Papa from 'papaparse';
import { useRef } from 'react';
import type { BatchRecord } from '../simulation/types';

export function DataManager() {
  const batches = useProcessStore((s) => s.batches);
  const importBatches = useProcessStore((s) => s.importBatches);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportCSV = () => {
    const rows = batches.flatMap((b) =>
      b.history.map((h) => ({
        batchId: b.id,
        batchName: b.name,
        source: b.source,
        time: h.time,
        temperature: h.temperature,
        ph: h.ph,
        dissolvedOxygen: h.dissolvedOxygen,
        biomass: h.biomass,
        substrate: h.substrate,
        product: h.product,
        unit_biomass: 'g/L',
        unit_time: 'h',
        generatedAt: new Date().toISOString(),
      }))
    );
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biofoundry-export-${Date.now()}.csv`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (res) => {
        // Simple: treat as one batch
        const data = res.data as any[];
        if (data.length === 0) return;
        const batch: BatchRecord = {
          id: `UP-${Date.now()}`,
          name: file.name,
          startTime: new Date().toISOString(),
          currentStage: '기록검토',
          params: { temperature: 30, ph: 6.5, dissolvedOxygen: 40, agitationSpeed: 200, initialBiomass: 0.1, initialSubstrate: 20, muMax: 0.4, ks: 0.5, yxs: 0.5, ypx: 0.3, cultureDuration: 24 },
          history: data.map((row, i) => ({
            time: Number(row.time || i),
            temperature: Number(row.temperature || 30),
            ph: Number(row.ph || 6.5),
            dissolvedOxygen: Number(row.dissolvedOxygen || 40),
            agitationSpeed: 200,
            biomass: Number(row.biomass || 0),
            substrate: Number(row.substrate || 0),
            product: Number(row.product || 0),
          })),
          logs: [{ time: new Date().toISOString(), event: 'CSV 업로드', details: file.name }],
          qualityCriteria: { minBiomass: 1, maxPhDeviation: 1, minDo: 10 },
          isSimulated: false,
          source: 'upload',
        };
        importBatches([batch]);
      },
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">데이터 관리</h2>
      <div className="flex gap-4">
        <button onClick={exportCSV} className="px-4 py-2 bg-cyan-600 rounded">CSV 내보내기</button>
        <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-slate-700 rounded">CSV 가져오기</button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
      </div>
      <p className="text-sm text-slate-400">
        시뮬레이션 결과와 실제 측정값은 별도 데이터 유형으로 관리됩니다.
        <br />필수 메타데이터: 단위, 생성 시점, 출처(source) 포함.
      </p>
      <div className="text-xs">
        총 배치: {batches.length} (시뮬레이션: {batches.filter(b => b.source === 'simulation').length}, 업로드: {batches.filter(b => b.source === 'upload').length})
      </div>
    </div>
  );
}
