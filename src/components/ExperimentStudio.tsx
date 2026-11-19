import { useState } from 'react';
import { useProcessStore } from '../store/useProcessStore';
import { simulateTimeSeries } from '../simulation/engine';
import { DEFAULT_PARAMS } from '../simulation/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ExperimentStudio() {
  const addBatch = useProcessStore((s) => s.addBatch);
  const [conditions, setConditions] = useState([
    { name: '조건 A', temp: 30, ph: 6.5 },
    { name: '조건 B', temp: 28, ph: 7.0 },
    { name: '조건 C', temp: 32, ph: 6.0 },
  ]);

  const results = conditions.map((c) => ({
    name: c.name,
    data: simulateTimeSeries({ ...DEFAULT_PARAMS, temperature: c.temp, ph: c.ph }),
  }));

  const merged = results[0].data.map((d, i) => ({
    time: d.time,
    A: results[0].data[i]?.biomass,
    B: results[1].data[i]?.biomass,
    C: results[2].data[i]?.biomass,
  }));

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">실험 스튜디오 · 조건 비교</h2>
      <div className="grid grid-cols-3 gap-4">
        {conditions.map((c, i) => (
          <div key={i} className="bg-slate-900 p-4 rounded">
            <input
              className="bg-slate-800 px-2 py-1 rounded w-full mb-2"
              value={c.name}
              onChange={(e) => {
                const next = [...conditions];
                next[i].name = e.target.value;
                setConditions(next);
              }}
            />
            <label className="text-xs">온도</label>
            <input type="number" value={c.temp} onChange={(e) => {
              const next = [...conditions];
              next[i].temp = Number(e.target.value);
              setConditions(next);
            }} className="w-full bg-slate-800 px-2 py-1 rounded" />
            <label className="text-xs">pH</label>
            <input type="number" step="0.1" value={c.ph} onChange={(e) => {
              const next = [...conditions];
              next[i].ph = Number(e.target.value);
              setConditions(next);
            }} className="w-full bg-slate-800 px-2 py-1 rounded" />
          </div>
        ))}
      </div>
      <div className="h-80">
        <ResponsiveContainer>
          <LineChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="A" stroke="#22c55e" name={conditions[0].name} />
            <Line dataKey="B" stroke="#3b82f6" name={conditions[1].name} />
            <Line dataKey="C" stroke="#f59e0b" name={conditions[2].name} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button
        onClick={() => conditions.forEach((c) => addBatch(c.name, { temperature: c.temp, ph: c.ph }))}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        조건으로 배치 생성
      </button>
    </div>
  );
}
