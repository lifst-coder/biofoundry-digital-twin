import { useProcessStore } from './store/useProcessStore';
import { FacilityMap } from './components/FacilityMap';
import { ProcessTimeline } from './components/ProcessTimeline';
import { lazy, Suspense, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

// Chart and CSV tabs load on demand so the first screen does not pay for recharts and papaparse.
const Bioreactor = lazy(() => import('./components/Bioreactor').then((m) => ({ default: m.Bioreactor })));
const QCPanel = lazy(() => import('./components/QCPanel').then((m) => ({ default: m.QCPanel })));
const ExperimentStudio = lazy(() => import('./components/ExperimentStudio').then((m) => ({ default: m.ExperimentStudio })));
const Analytics = lazy(() => import('./components/Analytics').then((m) => ({ default: m.Analytics })));
const DataManager = lazy(() => import('./components/DataManager').then((m) => ({ default: m.DataManager })));

const TABS = [
  { id: 'facility', label: '시설' },
  { id: 'bioreactor', label: '발효조' },
  { id: 'process', label: '공정' },
  { id: 'qc', label: '품질관리' },
  { id: 'experiment', label: '실험' },
  { id: 'analytics', label: '분석' },
  { id: 'data', label: '데이터' },
];

const ZONE_TO_TAB: Record<string, string> = {
  research: 'experiment',
  cultivation: 'bioreactor',
  production: 'process',
  analysis: 'qc',
  data: 'data',
  maintenance: 'analytics',
};

export default function App() {
  const [tab, setTab] = useState('facility');
  const selectedZone = useProcessStore((s) => s.selectedZone);
  const setZone = useProcessStore((s) => s.setZone);
  const addBatch = useProcessStore((s) => s.addBatch);
  const batches = useProcessStore((s) => s.batches);
  const currentId = useProcessStore((s) => s.currentBatchId);
  const setCurrent = (id: string) => useProcessStore.setState({ currentBatchId: id });

  useEffect(() => {
    if (selectedZone && ZONE_TO_TAB[selectedZone]) {
      setTab(ZONE_TO_TAB[selectedZone]);
      setZone(null);
    }
  }, [selectedZone, setZone]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">바이오파운더리 디지털 트윈</h1>
          <p className="text-xs text-slate-400">교육 및 비민감 연구용 · 가상 바이오공정 플랫폼</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={currentId || ''}
            onChange={(e) => setCurrent(e.target.value)}
            className="bg-slate-800 px-3 py-1 rounded text-sm"
          >
            <option value="">배치 선택</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
            ))}
          </select>
          <button
            onClick={() => addBatch(`배치-${batches.length + 1}`)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 rounded text-sm"
          >
            <Plus className="w-4 h-4" /> 새 배치
          </button>
        </div>
      </header>

      <nav className="flex border-b border-slate-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-6 py-3 text-sm whitespace-nowrap ${tab === t.id ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        <Suspense fallback={<div className="p-6 text-slate-400">불러오는 중…</div>}>
          {tab === 'facility' && <FacilityMap />}
          {tab === 'bioreactor' && <Bioreactor />}
          {tab === 'process' && <ProcessTimeline />}
          {tab === 'qc' && <QCPanel />}
          {tab === 'experiment' && <ExperimentStudio />}
          {tab === 'analytics' && <Analytics />}
          {tab === 'data' && <DataManager />}
        </Suspense>
      </main>

      <footer className="border-t border-slate-800 px-6 py-3 text-xs text-slate-500 text-center">
        본 플랫폼은 교육용 가상 환경입니다. 실제 생물공정 예측, GMP 준수, 또는 민감 연구에 사용하지 마십시오.
      </footer>
    </div>
  );
}
