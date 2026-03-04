# PRD.md — LifeMap 요구사항 정의서

> 이 문서를 기반으로 동일한 코드 작업을 수행하면 동일한 결과물이 나올 수 있도록 설계된 기술 명세서.
> 프로젝트 진행에 따라 지속적으로 업데이트한다.

## 1. 프로젝트 개요

### 1.1 정의
**LifeMap** — 나의 삶의 관계를 정리하는 시각화 도구

"피그마 스타일 무한 캔버스 위에서 내 삶의 모든 관계(사람·조직·활동·목표)를 노드와 연결선으로 시각화하고, 각 노드에 풍부한 메모를 기록하는 개인용 웹 도구"

### 1.2 핵심 가치
| 영감 출처 | 가져올 핵심 기능 |
|-----------|-----------------|
| Figma | 무한 캔버스, 팬/줌, 다중 선택, 미니맵 |
| Kumu | 라벨링된 관계선, 연결선 유형, 네트워크 그래프 뷰 |
| Heptabase | 카드형 노드 + 마크다운 메모, 화이트보드 위 자유 배치 |
| XMind | 마인드맵 자동 레이아웃, 만다라트(Grid) 뷰 |
| TheBrain | 노드 클릭 시 중심 재배치(Focus Mode) |
| Miro | 도형, 프레임(영역 그룹핑), 한국어 UI |
| **Toss/토스** | **UI/UX 디자인 철학 — 미니멀, 직관적 피드백, blue500(#3182F6) 기반 컬러, 부드러운 마이크로 인터랙션** |

### 1.3 디자인 철학 (Toss Design Principles)
1. **Simple** — 불필요한 요소를 제거하고 핵심에 집중. 여백은 곧 기능이다.
2. **Logical** — 정보 위계를 명확하게. 색상·크기·무게감으로 시각 우선순위 전달.
3. **Intuitive** — 설명 없이도 알 수 있는 UI. 피드백은 즉각적으로.
4. **Korean-first** — Pretendard 폰트, 한국어 UX 라이팅, 자연스러운 한국어 메시지.

## 2. 기술 스택

| 카테고리 | 기술 | 버전 | 비고 |
|---------|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.x | Turbopack 기반 |
| UI 라이브러리 | React | 19.x | |
| 언어 | TypeScript | ^5 | |
| 스타일링 | Tailwind CSS | v4 | CSS-first 설정 |
| UI 컴포넌트 | shadcn/ui (Radix UI 기반) | 최신 | New York 스타일 |
| 백엔드/DB | Supabase (PostgreSQL) | 최신 | @supabase/ssr 사용 |
| 배포 | Vercel | - | GitHub 연동 자동 배포 |
| 캔버스/노드 그래프 | @xyflow/react (React Flow) | ^12.10.0 | |
| 마크다운 에디터 | @tiptap/react + extensions | ^3.20.0 | |
| 상태 관리 | Zustand + Immer | ^5 / ^11 | persist 미들웨어 |
| 마인드맵 레이아웃 | dagre | ^0.8.5 | |
| 네트워크 그래프 | d3-force | ^3.0.0 | |
| 퍼지 검색 | fuse.js | ^7.0.0 | |
| 한글 초성 | hangul-js | ^0.2.6 | |
| ID 생성 | nanoid | ^5.0.0 | |
| 아이콘 | lucide-react | ^0.576.0 | |
| 토스트/알림 | sonner | 최신 | Toss 스타일 플로팅 토스트 |
| 유틸리티 | clsx, tailwind-merge, class-variance-authority, date-fns | 최신 | |

## 3. 데이터 모델

### 3.1 Node (노드)
```typescript
interface Node {
  id: string;                          // nanoid 생성
  type: 'person' | 'organization' | 'activity' | 'goal';
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;                       // HEX
  icon?: string;
  avatar?: string;
  shape: 'rounded-rect' | 'circle' | 'diamond' | 'hexagon';
  memo: string;                        // 마크다운
  tags: string[];
  createdAt: string;                   // ISO 8601
  updatedAt: string;
  mandalart?: {
    level: 'core' | 'sub' | 'action';
    parentGoalId?: string;
    gridPosition?: number;             // 0-8
  };
}
```

### 3.2 Edge (연결선)
```typescript
interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationshipType: 'family' | 'friend' | 'mentor' | 'colleague'
    | 'member' | 'collaborator' | 'supports' | 'influences' | 'custom';
  color: string;
  thickness: 1 | 2 | 3 | 4;
  style: 'solid' | 'dashed' | 'dotted';
  direction: 'none' | 'forward' | 'backward' | 'both';
  memo?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Frame (프레임)
```typescript
interface Frame {
  id: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  childNodeIds: string[];
}
```

### 3.4 ViewState (뷰 상태)
```typescript
interface ViewState {
  currentView: 'canvas' | 'mindmap' | 'mandalart' | 'graph';
  canvas: { panX: number; panY: number; zoom: number; };
  selectedNodeIds: string[];
  focusNodeId?: string;
  filters: {
    nodeTypes: NodeType[];
    tags: string[];
    relationshipTypes: RelationshipType[];
  };
}
```

### 3.5 AppState (전체 앱 상태)
```typescript
interface AppState {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  frames: Record<string, Frame>;
  viewState: ViewState;
  history: { past: Snapshot[]; future: Snapshot[]; };
}
```

## 4. 핵심 기능 명세

### 4.1 무한 캔버스 (Figma-style)
- CSS transform 기반 div 렌더링 (@xyflow/react 사용)
- 마우스 휠 줌 (0.1x ~ 3.0x)
- Space + 드래그로 팬
- 트랙패드 핀치 줌, 2핑거 팬
- 줌 레벨 표시 (좌하단)
- 미니맵 (우하단)
- Shift+1 Fit to View
- 뷰포트 밖 노드 렌더링 스킵 (가상화)

### 4.2 노드 시스템
- 4가지 타입: Person(파랑), Organization(보라), Activity(초록), Goal(오렌지)
- 생성: 캔버스 더블클릭 / 좌측 사이드바 드래그 / 단축키 N
- 상호작용: 클릭(선택), 더블클릭(인라인 편집), 드래그(이동), Shift+클릭(다중 선택)
- 노드 가장자리 핸들 드래그로 연결선 생성

### 4.3 연결선 시스템 (Kumu 영감)
- 노드 핸들 드래그 또는 두 노드 선택 후 L 키
- 9가지 관계 유형: family, friend, mentor, colleague, member, collaborator, supports, influences, custom
- 관계 유형별 기본 스타일 (색상, 두께, 선 스타일, 방향)
- 연결선 라벨 표시, 호버 시 툴팁

### 4.4 상세 메모 패널 (Heptabase 영감)
- 우측 슬라이드인 패널
- @tiptap/react 마크다운 에디터
- 지원: H1-H3, 볼드, 이탤릭, 리스트, 체크리스트, 코드블록, 인용, 링크, 이미지
- 연결된 관계 목록 표시
- 태그 관리

### 4.5 뷰 모드 (4가지)
1. **Canvas 뷰** (기본): 자유 배치 무한 캔버스
2. **Mind Map 뷰**: dagre 기반 방사형 자동 레이아웃
3. **Mandalart 뷰**: Goal 노드 3×3 → 9×9 그리드
4. **Network Graph 뷰**: d3-force 기반, Focus Mode 지원

### 4.6 검색 & 필터
- Cmd+K 글로벌 검색 (fuse.js + hangul-js 한글 초성)
- 노드 타입별, 태그별, 관계 유형별 필터

### 4.7 단축키
| 키 | 동작 |
|----|------|
| Space + Drag | 캔버스 팬 |
| Cmd/Ctrl + 휠 | 줌 |
| Shift + 1 | Fit to View |
| N | 새 노드 |
| L | 두 노드 연결 |
| Delete | 삭제 |
| Cmd/Ctrl + Z/Shift+Z | Undo/Redo |
| Cmd/Ctrl + K | 검색 |
| 1/2/3/4 | 뷰 전환 |

## 5. 프로젝트 구조

```
lifemap/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── canvas/          # LifeMapCanvas, MiniMap, ZoomControls
│   ├── nodes/           # PersonNode, OrganizationNode, ActivityNode, GoalNode
│   ├── edges/           # RelationshipEdge, EdgeLabel
│   ├── panels/          # LeftSidebar, RightPanel, MemoEditor, ConnectionList
│   ├── views/           # CanvasView, MindMapView, MandalartView, NetworkGraphView
│   ├── toolbar/         # TopBar, ViewSwitcher, SearchDialog
│   └── ui/              # shadcn/ui 기반 (Button, Input, Select, Dialog, Tooltip, Badge, Tabs, Sonner 등)
├── stores/              # useMapStore, useViewStore, useHistoryStore (Zustand)
├── lib/
│   ├── supabase/        # client.ts, server.ts (Supabase 클라이언트)
│   ├── constants.ts     # 상수값
│   ├── utils.ts         # cn() 등 유틸리티
│   ├── layouts.ts       # dagre, d3-force 레이아웃
│   ├── search.ts        # fuse.js + hangul-js 검색
│   └── export.ts        # JSON/PNG/SVG 내보내기
├── types/               # index.ts (중앙 타입 정의)
├── hooks/               # useKeyboardShortcuts, useAutoSave, useCanvasGestures
└── public/fonts/
```

## 6. 데이터 영속화 & 배포

### 6.1 데이터 저장
- **Phase 1 (MVP)**: localStorage 자동저장 (1초 디바운스) + 새로고침 시 자동 복원
  - **저장 피드백**: Toss 스타일 플로팅 토스트 (sonner) — 하단 중앙, 1.5초 자동 소멸
  - **하단 상태바**: 마지막 저장 시각 표시 (HH:MM 형식)
  - **에러 처리**: 저장 실패 시 경고 토스트 + 원인 안내
- **Phase 2**: Supabase PostgreSQL 연동 (클라우드 저장 + 다기기 동기화)
- **Phase 3**: Supabase Auth 연동 (사용자 인증, 개인 데이터 분리)

### 6.2 Supabase 구성
- **클라이언트**: `@supabase/ssr` 사용 (SSR/클라이언트 겸용)
- **브라우저**: `lib/supabase/client.ts` — `createBrowserClient()`
- **서버**: `lib/supabase/server.ts` — `createServerClient()`
- **환경 변수**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6.3 배포
- **Vercel** 배포 (GitHub 연동 자동 CI/CD)
- Vercel 환경 변수에 Supabase 키 설정

## 7. 구현 우선순위

### Phase 1: Core Canvas (MVP)
- Next.js 세팅 + Tailwind + Pretendard
- React Flow 무한 캔버스
- 4가지 커스텀 노드
- 연결선 생성 + 관계 유형
- 우측 상세 패널 (기본 메모)
- localStorage 자동 저장
- 기본 단축키

### Phase 2: Rich Features
- Tiptap 마크다운 에디터
- 프레임, 태그, 필터, 검색
- 연결선 커스터마이징
- Undo/Redo, JSON 내보내기/가져오기

### Phase 3: View Modes
- Mind Map, Network Graph, Mandalart 뷰
- Focus Mode, 뷰 전환 애니메이션

### Phase 4: Polish
- 반응형, 다크 모드, PNG/SVG 내보내기
- 온보딩, 성능 최적화

## 8. 제약사항
- 노드 500개 이상 시 가상화 필수
- localStorage 5MB 제한 → Supabase 연동 후 해소
- 이미지 base64 1MB 이하 리사이즈 (Supabase Storage 연동 시 해소)
- Chrome/Edge 120+, Safari 17+, Firefox 120+

---
*최종 수정: 2026-03-04 (Supabase + shadcn/ui + Vercel 스택 반영)*
