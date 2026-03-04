# DESIGN.md — LifeMap 디자인 시스템

> UI/UX 디자인, 프론트엔드 스타일링, 컴포넌트, 테마 관련 요소를 기록하고 업데이트한다.
> **Toss Design System (TDS)** 철학을 기반으로, shadcn/ui를 적극 활용한다.

## 1. 디자인 방향

**Toss/토스 스타일** — 미니멀하고 깔끔한 한국형 UI

### 1.1 디자인 원칙 (Toss Design Principles)
| 원칙 | 설명 | LifeMap 적용 |
|------|------|-------------|
| **Simple** | 불필요한 요소 제거, 핵심에 집중 | 최소한의 크롬, 넉넉한 여백, 콘텐츠 중심 |
| **Logical** | 시각 위계로 정보 우선순위 전달 | 색상·크기·weight로 노드 타입 즉시 구분 |
| **Intuitive** | 설명 없이도 알 수 있는 UI | 즉각적 피드백, 자연스러운 애니메이션 |
| **Accessible** | 모든 사용자가 접근 가능 | Radix UI 프리미티브, 키보드 내비게이션 |

### 1.2 핵심 디자인 특징
- **둥근 모서리**: border-radius 12~16px (Toss의 부드러운 인상)
- **부드러운 그림자**: `box-shadow: 0 4px 24px rgba(0,0,0,0.08)` (가벼운 부유감)
- **넉넉한 여백**: 콘텐츠 간 최소 16px, 섹션 간 24~32px
- **명확한 시각 계층**: primary → foreground → muted-foreground → border 4단계
- **마이크로 인터랙션**: 모든 상태 변화에 0.15~0.3s ease 트랜지션
- **플로팅 피드백**: Toss 스타일 토스트 (sonner) — 하단 중앙, 둥근 모서리, 가벼운 그림자

### 1.3 레퍼런스
| 서비스 | 참고 포인트 |
|--------|------------|
| **토스 (Toss)** | **전반적 UI 톤, 여백, 타이포, 컬러 시스템 (blue500 #3182F6), 플로팅 토스트** |
| **토스증권 (tossinvest)** | **카드 컴포넌트, 데이터 시각화, 정보 위계, 깔끔한 수치 표시** |
| Figma | 캔버스 UX, 팬/줌 인터랙션, 미니맵 |
| Heptabase | 카드형 노드, 메모 패널 |
| Kumu | 관계선 시각화, 그래프 뷰 |
| Linear | 사이드바 네비게이션, 검색 다이얼로그 |

## 2. 컬러 팔레트

### 2.1 Toss 컬러 시스템 (TDS Color System)

TDS는 OKLCH 기반으로 수치적으로 정돈된 컬러 팔레트를 사용한다.
LifeMap은 Toss blue500(`#3182F6`)을 primary로, Toss의 gray scale을 기본 텍스트/배경으로 사용한다.

#### Gray Scale (Toss 스타일)
| 토큰 | HEX | 용도 |
|------|-----|------|
| gray-900 | `#191F28` | 최상위 텍스트 (제목, 중요 정보) |
| gray-800 | `#333D4B` | 본문 텍스트 |
| gray-700 | `#4E5968` | 보조 텍스트, 하단바 수치 |
| gray-600 | `#6B7684` | 비활성 텍스트 |
| gray-500 | `#8B95A1` | 캡션, 타임스탬프 |
| gray-400 | `#B0B8C1` | 플레이스홀더 |
| gray-300 | `#D1D6DB` | 구분점, 비활성 보더 |
| gray-200 | `#E5E8EB` | 보더, 디바이더 |
| gray-100 | `#F2F4F6` | 보조 배경, 하단바 보더 |
| gray-50  | `#F9FAFB` | 캔버스 배경 |
| white    | `#FFFFFF` | 카드/패널 배경 |

#### Brand Colors
| 토큰 | HEX | 용도 |
|------|-----|------|
| **blue-500 (Primary)** | `#3182F6` | Toss Blue — 주 액센트, CTA, 선택 상태, 포커스 링 |
| blue-400 | `#4E9AF8` | 호버 상태 |
| blue-100 | `#E8F3FF` | 선택 배경, 강조 배경 |
| red-500 | `#FF4545` | 에러, 삭제, 위험 |
| red-100 | `#FFEBEE` | 에러 배경 |
| green-500 | `#00C853` | 성공, 완료 |
| green-100 | `#E8F5E9` | 성공 배경 |
| yellow-500 | `#FFC107` | 경고, 주의 |

### 2.2 기본 색상 (shadcn/ui CSS 변수 기반)
shadcn/ui 표준 CSS 변수 체계를 사용하며, HSL 값으로 정의한다.
Toss의 컬러 시스템에 맞춰 튜닝되었다.
```css
:root {
  --background: 210 20% 98%;     /* gray-50 캔버스 배경 */
  --foreground: 220 20% 12%;     /* gray-900 기본 텍스트 */
  --card: 0 0% 100%;             /* white 패널/카드 배경 */
  --primary: 214 100% 58%;       /* blue-500 Toss Blue */
  --secondary: 220 13% 95%;      /* gray-100 보조 배경 */
  --muted: 220 13% 95%;          /* gray-100 비활성 배경 */
  --muted-foreground: 215 10% 54%; /* gray-600 비활성 텍스트 */
  --border: 220 13% 91%;         /* gray-200 테두리 */
  --ring: 214 100% 58%;          /* blue-500 포커스 링 */
  --radius: 0.75rem;             /* 12px — Toss 기본 radius */
}
```
다크 모드는 `.dark` 클래스로 전환한다.

### 2.3 노드 타입 색상
| 타입 | 색상 | HEX | CSS 변수 | 용도 |
|------|------|-----|---------|------|
| Person | Toss Blue | `#3182F6` | `--color-person` | 사람 노드 |
| Organization | Purple | `#8B5CF6` | `--color-organization` | 조직 노드 |
| Activity | Green | `#10B981` | `--color-activity` | 활동 노드 |
| Goal | Orange | `#F97316` | `--color-goal` | 목표 노드 |

### 2.4 관계선 색상
| 관계 | 색상 | HEX | CSS 변수 |
|------|------|-----|---------|
| family | 빨간색 | `#EF4444` | `--edge-family` |
| friend | 파란색 | `#3B82F6` | `--edge-friend` |
| mentor | 금색 | `#F59E0B` | `--edge-mentor` |
| colleague | 회색 | `#9CA3AF` | `--edge-colleague` |
| member | 보라색 | `#8B5CF6` | `--edge-member` |
| collaborator | 초록색 | `#10B981` | — |
| supports | 청록색 | `#06B6D4` | — |
| influences | 핑크색 | `#EC4899` | — |
| custom | 기본회색 | `#6B7280` | — |

## 3. 타이포그래피

### 폰트
- **주 폰트**: Pretendard Variable (한국어 최적화, Toss 공식 폰트)
- **폴백**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **적용**: CDN 웹폰트 (`PretendardVariable.woff2`)
- **letter-spacing**: -0.01em (Toss 스타일 약간 타이트한 자간)

### 크기 체계 (Toss 스타일)
| 용도 | 크기 | 굵기 | 행간 | Toss 매핑 |
|------|------|------|------|----------|
| 제목 (H1) | 20px | 700 (Bold) | 1.3 | heading1 |
| 소제목 (H2) | 16px | 600 (SemiBold) | 1.4 | heading2 |
| 노드 라벨 | 14px | 600 (SemiBold) | 1.4 | body1-bold |
| 메모 본문 | 14px | 400 (Regular) | 1.6 | body1 |
| UI 요소 | 13px | 500 (Medium) | 1.4 | body2 |
| 캡션/상태바 | 12px | 400 (Regular) | 1.4 | caption1 |
| 마이크로 | 11px | 500 (Medium) | 1.3 | caption2 |

## 4. UI 컴포넌트 기술 스택

### 4.1 shadcn/ui 기반 컴포넌트 (`components/ui/`)
**shadcn/ui** (New York 스타일, Radix UI 기반)를 적극 활용한다.
레지스트리 접근 제한 시 수동으로 생성하며, 동일한 API와 스타일을 따른다.

| 컴포넌트 | Radix 기반 | 용도 |
|---------|-----------|------|
| `Button` | @radix-ui/react-slot | 버튼 (default, destructive, outline, secondary, ghost, link + sm/lg/icon 크기) |
| `Input` | - | 텍스트 입력 |
| `Select` | @radix-ui/react-select | 드롭다운 선택 (노드 타입, 관계 유형) |
| `Dialog` | @radix-ui/react-dialog | 모달 다이얼로그 (확인, 설정) |
| `Tooltip` | @radix-ui/react-tooltip | 툴팁 (노드/엣지 호버 정보) |
| `Badge` | - | 태그/뱃지 (노드 태그, 관계 유형 라벨) |
| `Tabs` | @radix-ui/react-tabs | 뷰 모드 전환 탭 |
| `ScrollArea` | @radix-ui/react-scroll-area | 사이드 패널 스크롤 |
| `Separator` | @radix-ui/react-separator | 패널 내 구분선 |
| **`Sonner (Toaster)`** | **sonner** | **Toss 스타일 플로팅 토스트 — 자동저장 피드백, 에러 알림** |

### 4.2 핵심 의존성
| 라이브러리 | 용도 |
|-----------|------|
| class-variance-authority (cva) | 컴포넌트 변형(variant) 관리 |
| @radix-ui/* | 접근성 준수 headless UI 프리미티브 |
| @xyflow/react | 캔버스, 노드, 엣지 렌더링 |
| @tiptap/react | 마크다운 에디터 |
| lucide-react | 아이콘 시스템 (shadcn/ui 기본 아이콘) |
| **sonner** | **Toss 스타일 토스트/스낵바 (자동저장 피드백, 성공/에러 알림)** |
| tailwind-merge + clsx | cn() 유틸리티로 조건부 클래스 병합 |

### 4.3 아이콘
- **lucide-react** 아이콘 라이브러리 (shadcn/ui 기본 아이콘 라이브러리)
- 크기: 16px (소형), 20px (기본), 24px (대형)
- 색상: currentColor (부모 텍스트 색상 상속)
- shadcn/ui 컴포넌트 내부에서 자동으로 `[&_svg]:size-4` 적용

## 5. 레이아웃 구조

```
┌──────────────────────────────────────────────────────┐
│  Top Bar (h: 48px)  #FFFFFF bg, border-b #F2F4F6     │
│  [☰] LifeMap  [뷰 전환 탭]              [🔍 Cmd+K]   │
├────────┬──────────────────────────┬──────────────────┤
│ Left   │    Main Canvas           │  Right Panel     │
│ Sidebar│    (flex: 1)             │  (w: 320px)      │
│ (w:56px│    bg: #F9FAFB           │  bg: #FFFFFF     │
│  접힘시)│                          │  (조건부 표시)    │
│(w:240px│                          │                  │
│  펼침시)│                          │                  │
├────────┴──────────────────────────┴──────────────────┤
│  Status Bar (h: 32px)  #FFFFFF bg, border-t #F2F4F6  │
│  [노드 N · 연결 N]                   [HH:MM 저장됨]  │
└──────────────────────────────────────────────────────┘
                     ┌─────────────────────┐
                     │  🔵 변경사항이       │  ← Sonner 플로팅 토스트
                     │     저장되었어요     │     (bottom-center, 1.5s)
                     └─────────────────────┘
```

### 반응형 브레이크포인트
| 구간 | 너비 | 변화 |
|------|------|------|
| Desktop | 1280px+ | 전체 레이아웃 |
| Tablet | 768px ~ 1279px | 좌측 사이드바 아이콘만 |
| Mobile | ~767px | 사이드바 숨김, 패널 풀스크린 |

## 6. 노드 시각 디자인

### Person 노드
- 모양: rounded-rect (12px radius)
- 상단: 아바타/이모지 (32x32)
- 중앙: 이름 (14px, SemiBold)
- 하단: 역할 태그 (Badge)
- 기본 크기: 140 x 80px

### Organization 노드
- 모양: rounded-rect
- 상단: 🏢 아이콘
- 중앙: 조직명
- 하단: 유형 태그

### Activity 노드
- 모양: rounded-rect
- 상단: 📋 아이콘
- 중앙: 활동명
- 하단: 상태 태그

### Goal 노드
- 모양: diamond (다이아몬드)
- 상단: 🎯 아이콘
- 중앙: 목표명
- 하단: 진행률 바

## 7. 인터랙션 & 애니메이션

### Toss 스타일 트랜지션
- 호버 효과: `transition: all 0.15s ease`
- 노드 선택: `ring-2 ring-[#3182F6]` (Toss Blue 포커스 링)
- 패널 슬라이드: `transition: transform 0.2s ease`
- 뷰 전환: `transition: opacity 0.3s ease`
- 줌 애니메이션: React Flow 내장 `fitView` 트랜지션

### 피드백 시스템 (Toss 스타일)
| 이벤트 | 피드백 방식 | 지속시간 |
|--------|-----------|---------|
| 자동저장 완료 | 플로팅 토스트 (✓ 변경사항이 저장되었어요) | 1.5초 |
| 저장 실패 | 플로팅 토스트 (에러, 빨간) | 3초 |
| 노드 삭제 | 플로팅 토스트 + Undo 액션 | 3초 |
| 마지막 저장 시각 | 하단 상태바 인라인 (HH:MM 저장됨) | 상시 |

### 토스트 스타일 스펙
```css
/* Sonner 토스트 — Toss 스타일 */
border-radius: 16px;
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
padding: 12px 16px;
font-size: 14px;
font-weight: 500;
letter-spacing: -0.01em;
background: #FFFFFF;
color: #191F28;
```

## 8. 하단 상태바 디자인

Toss 스타일 미니멀 상태바:
```
┌────────────────────────────────────────────────────┐
│  노드 10 · 연결 13                 🔵 14:32 저장됨  │
│  ↑ gray-700    ↑ gray-300       ↑ blue-500  gray-500│
│  font: 11px/Medium                 font: 11px/Medium │
└────────────────────────────────────────────────────┘
```
- 높이: 32px
- 배경: `#FFFFFF`
- 상단 보더: `1px solid #F2F4F6` (gray-100)
- 좌측: 노드/연결/그룹 카운트 (gray-700, `·` 구분자 gray-300)
- 우측: 저장 상태 (blue-500 dot + 시각) + 앱 버전 (gray-400)

## 9. shadcn/ui 활용 가이드

### 설정
- `components.json`: New York 스타일, Tailwind v4 CSS 변수 모드
- 컴포넌트 경로: `@/components/ui/`
- 유틸 경로: `@/lib/utils` (`cn()` 함수)

### 새 컴포넌트 추가 시
1. shadcn/ui 공식 문서에서 코드 확인
2. `components/ui/` 하위에 파일 생성
3. 필요한 Radix UI 패키지 설치
4. 이 DESIGN.md 컴포넌트 목록에 추가

### 커스터마이징 원칙
- shadcn/ui 기본 스타일을 최대한 유지
- **Toss 컬러 시스템 우선**: hex 직접 사용 시 Toss gray/blue 팔레트 참조
- LifeMap 전용 스타일은 `className` prop으로 오버라이드
- CSS 변수(`globals.css`)로 테마 색상 통일 관리

---
*최종 수정: 2026-03-04 (Toss Design System 컬러/피드백 시스템 반영, Sonner 토스트 추가)*
