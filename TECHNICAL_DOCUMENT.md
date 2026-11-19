# 바이오파운더리 디지털 트윈 기술 문서

## 1. 아키텍처
- **프론트엔드**: React 19 + TypeScript + Vite
- **상태 관리**: Zustand (persist 미들웨어로 localStorage 저장)
- **차트**: Recharts
- **스타일**: Tailwind CSS v4
- **CSV**: PapaParse
- **아이콘**: Lucide React

시뮬레이션 엔진(`src/simulation/engine.ts`)은 순수 함수로 구현되어 UI와 완전 분리. 결정적 입력(파라미터 + 시간)에 대해 재현 가능한 결과 생성.

## 2. 시뮬레이션 모델
교육용 회분식 Monod 모델 (비병원성 가정, 예: 효모 유사).

- dX/dt = μ_max·f(T)·f(pH)·f(DO)·f(RPM)·S/(Ks+S)·X
- dS/dt = −(1/Y_X/S)·dX/dt, P = Y_P/X·(X − X0)
- 고정 간격 RK4(출력 간격당 10 부분 구간)로 적분하며, X + Y_X/S·S 가 보존됩니다.

주요 수식은 `MODEL_FORMULAS` 상수 및 Experiment Studio에서 공개.

한계 명시: 억제 효과, 다상 성장, 물질전달, 오염, 실제 생물학적 변동성 미반영. 실제 공정 예측 불가.

## 3. 데이터 모델
- `BatchRecord`: 배치 ID, 단계, 파라미터, 시계열 history, 로그, 품질 기준, source('simulation'|'upload')
- 센서 데이터와 메타데이터(단위, 생성 시점, 출처) 분리 관리

## 4. 주요 기능 구현 위치
- 시설 맵: `components/FacilityMap.tsx` → 구역 클릭 시 해당 탭으로 이동
- 발효조: `components/Bioreactor.tsx` + engine
- 공정 단계: `components/ProcessTimeline.tsx`
- QC: `components/QCPanel.tsx` (이상 탐지, 비교)
- 실험 비교: `components/ExperimentStudio.tsx`
- 분석: `components/Analytics.tsx`
- 데이터: `components/DataManager.tsx` (CSV import/export)

## 5. 테스트
- `npm test`: 엔진 단위 테스트 11개 (최적 조건의 μ, 질량 보존, 단조 증가와 정체기, 출력 간격 독립성, 경계 입력)
- `npm run build`: 타입 검사 후 번들. 차트·CSV 탭은 지연 로드되어 첫 화면 스크립트는 약 240 kB입니다.
- 시뮬레이션 함수는 순수 함수로 동일 입력 → 동일 출력 보장
- 비정상 입력(음수, 0)은 0으로 잘라 처리
- 상태 전이, 로그 기록은 Zustand 액션으로 관리

## 6. 실행 및 배포
```bash
cd biofoundry-digital-twin
npm install
npm run dev
```
정적 배포 시 `dist/` 폴더 사용.

## 7. 면책
본 시스템은 **교육 및 비민감 연구용** 가상 플랫폼입니다.  
실제 바이오공정 설계, 예측, 규제 준수(GMP 등)에 사용하지 마십시오.  
모든 품질 기준은 가상의 교육용 값입니다.
