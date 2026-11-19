import { useProcessStore } from '../store/useProcessStore';
import { simulateTimeSeries, MODEL_FORMULAS } from '../simulation/engine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Settings } from 'lucide-react';
import { useState } from 'react';

export function Bioreactor() {
  const current = useProcessStore((s) => s.getCurrentBatch());
  const runSimulation = useProcessStore((s) => s.runSimulation);
  const updateParams = useProcessStore((s) => s.updateParams);
  const [showFormulas, setShowFormulas] = useState(false);

  if (!current) {
    return <div className="p-6 text-slate-400">먼저 배치를 생성하세요.</div>;
  }

  const data = current.history.length ? current.history : simulateTimeSeries(current.params);

  const handleParam = (key: string, value: number) => {
    updateParams(current.id, { [key]: value });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">가상 발효조 · {current.name}</h2>
        <button
          onClick={() => runSimulation(current.id)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
        >
          <Play className="w-4 h-4" /> 시뮬레이션 실행
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {[
          ['온도 (°C)', 'temperature', 20, 40],
          ['pH', 'ph', 4, 9],
          ['용존산소 (%)', 'dissolvedOxygen', 0, 100],
          ['교반속도 (RPM)', 'agitationSpeed', 50, 600],
        ].map(([label, key, min, max]) => (
          <div key={key as string} className="bg-slate-900 p-3 rounded-lg">
            <label className="block text-slate-400">{label}</label>
            <input
              type="range"
              min={min as number}
              max={max as number}
              step={0.1}
              value={(current.params as any)[key as string]}
              onChange={(e) => handleParam(key as string, Number(e.target.value))}
              className="w-full"
            />
            <div className="text-right font-mono">{(current.params as any)[key as string]}</div>
          </div>
        ))}
      </div>

      <div className="h-80 bg-slate-900 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
            <Legend />
            <Line type="monotone" dataKey="biomass" name="생체량 (g/L)" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="substrate" name="기질 (g/L)" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="product" name="산물 (g/L)" stroke="#a855f7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setShowFormulas(!showFormulas)} className="flex items-center gap-2 text-sm text-cyan-400">
          <Settings className="w-4 h-4" /> 모델 수식 및 가정
        </button>
      </div>
      {showFormulas && (
        <pre className="bg-slate-950 p-4 rounded text-xs overflow-auto whitespace-pre-wrap">{MODEL_FORMULAS}</pre>
      )}
      <p className="text-xs text-slate-500">※ 교육용 단순화 모델. 실제 생물학적 공정 예측에 사용하지 마십시오.</p>
    </div>
  );
}
