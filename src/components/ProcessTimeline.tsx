import { useProcessStore, STAGE_ORDER } from '../store/useProcessStore';
import type { ProcessStage } from '../simulation/types';

export function ProcessTimeline() {
  const current = useProcessStore((s) => s.getCurrentBatch());
  const updateStage = useProcessStore((s) => s.updateStage);

  if (!current) return null;

  const currentIdx = STAGE_ORDER.indexOf(current.currentStage);

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">배치 공정 단계 · {current.id}</h3>
      <div className="flex flex-wrap gap-2">
        {STAGE_ORDER.map((stage, i) => (
          <button
            key={stage}
            onClick={() => updateStage(current.id, stage as ProcessStage)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              i <= currentIdx
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {stage}
          </button>
        ))}
      </div>
      <div className="mt-6 max-h-48 overflow-auto bg-slate-900 rounded p-3 text-xs">
        {current.logs.slice().reverse().map((log, i) => (
          <div key={i} className="border-b border-slate-800 py-1">
            <span className="text-slate-500">{new Date(log.time).toLocaleString()}</span> · {log.event}
            {log.details && <span className="text-slate-400"> ({log.details})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
