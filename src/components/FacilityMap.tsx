import { useProcessStore } from '../store/useProcessStore';
import { Beaker, FlaskConical, Factory, Microscope, Database, Wrench, Home } from 'lucide-react';

const ZONES = [
  { id: 'research', name: '연구 및 설계 구역', icon: Beaker, color: 'bg-blue-500' },
  { id: 'cultivation', name: '배양 및 발효 구역', icon: FlaskConical, color: 'bg-green-500' },
  { id: 'production', name: '생산 설비 구역', icon: Factory, color: 'bg-amber-500' },
  { id: 'analysis', name: '분석 및 품질관리 구역', icon: Microscope, color: 'bg-purple-500' },
  { id: 'data', name: '데이터 관리 구역', icon: Database, color: 'bg-cyan-500' },
  { id: 'maintenance', name: '설비 유지관리 구역', icon: Wrench, color: 'bg-slate-500' },
];

export function FacilityMap() {
  const setZone = useProcessStore((s) => s.setZone);
  const selected = useProcessStore((s) => s.selectedZone);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Home className="w-6 h-6" /> 가상 바이오파운더리
      </h2>
      <p className="text-sm text-slate-400 mb-6">교육용 디지털 트윈 · 실제 GMP 인증 제품이 아닙니다</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ZONES.map((z) => {
          const Icon = z.icon;
          return (
            <button
              key={z.id}
              onClick={() => setZone(z.id)}
              className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                selected === z.id ? 'border-white bg-slate-800' : 'border-slate-700 bg-slate-900'
              }`}
            >
              <div className={`w-12 h-12 ${z.color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold text-left">{z.name}</div>
              <div className="text-xs text-slate-400 mt-1">클릭하여 진입</div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 p-4 bg-slate-900 rounded-lg text-sm text-slate-300">
        2.5D 시각화: 구역 선택 시 해당 장비 및 데이터 화면으로 이동합니다.
      </div>
    </div>
  );
}
