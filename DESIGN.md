# DESIGN.md — LifeMap 디자인 시스템

> UI/UX 디자인, 프론트엔드 스타일링, 컴포넌트, 테마 관련 요소를 기록하고 업데이트한다.

## 1. 디자인 방향

**Toss/토스 스타일** — 미니멀하고 깔끔한 한국형 UI
- 둥근 모서리 (border-radius: 12px)
- 부드러운 그림자
- 넉넉한 여백
- 명확한 시각 계층

### 레퍼런스
| 서비스 | 참고 포인트 |
|--------|------------|
| 토스 (Toss) | 전반적인 UI 톤, 여백, 타이포그래피 |
| Figma | 캔버스 UX, 팬/줌 인터랙션, 미니맵 |
| Heptabase | 카드형 노드, 메모 패널 |
| Kumu | 관계선 시각화, 그래프 뷰 |
| Linear | 사이드바 네비게이션, 검색 다이얼로그 |

## 2. 컬러 팔레트

### 2.1 기본 색상 (shadcn/ui CSS 변수 기반)
shadcn/ui 표준 CSS 변수 체계를 사용하며, HSL 값으로 정의한다.
```css
:root {
  --background: 210 20% 98%;     /* 캔버스 배경 (라이트) */
  --foreground: 220 20% 12%;     /* 기본 텍스트 */
  --card: 0 0% 100%;             /* 패널/카드 배경 */
  --primary: 214 100% 58%;       /* 주 액센트 (파란색) */
  --secondary: 220 13% 95%;      /* 보조 배경 */
  --muted: 220 13% 95%;          /* 비활성 배경 */
  --muted-foreground: 215 10% 54%; /* 비활성 텍스트 */
  --border: 220 13% 91%;         /* 테두리 */
  --ring: 214 100% 58%;          /* 포커스 링 */
  --radius: 0.75rem;             /* 기본 border-radius */
}
```
다크 모드는 `.dark` 클래스로 전환한다.

### 2.2 노드 타입 색상
| 타입 | 색상 | HEX | 용도 |
|------|------|-----|------|
| Person | 파란색 | #3182F6 | 사람 노드 |
| Organization | 보라색 | #8B5CF6 | 조직 노드 |
| Activity | 초록색 | #10B981 | 활동 노드 |
| Goal | 오렌지 | #F97316 | 목표 노드 |

### 2.3 관계선 색상
| 관계 | 색상 | HEX |
|------|------|-----|
| family | 빨간색 | #EF4444 |
| friend | 파란색 | #3B82F6 |
| mentor | 금색 | #F59E0B |
| colleague | 회색 | #9CA3AF |
| member | 보라색 | #8B5CF6 |
| collaborator | 초록색 | #10B981 |
| supports | 청록색 | #06B6D4 |
| influences | 핑크색 | #EC4899 |
| custom | 기본회색 | #6B7280 |

## 3. 타이포그래피

### 폰트
- **주 폰트**: Pretendard (한국어 최적화)
- **폴백**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **적용**: CDN 웹폰트 (`PretendardVariable.woff2`)

### 크기 체계
| 용도 | 크기 | 굵기 | 행간 |
|------|------|------|------|
| 노드 라벨 | 14px | 600 (SemiBold) | 1.4 |
| 메모 본문 | 14px | 400 (Regular) | 1.6 |
| UI 요소 | 13px | 500 (Medium) | 1.4 |
| 제목 (H1) | 20px | 700 (Bold) | 1.3 |
| 소제목 (H2) | 16px | 600 (SemiBold) | 1.4 |
| 캡션 | 12px | 400 (Regular) | 1.4 |

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

### 4.2 핵심 의존성
| 라이브러리 | 용도 |
|-----------|------|
| class-variance-authority (cva) | 컴포넌트 변형(variant) 관리 |
| @radix-ui/* | 접근성 준수 headless UI 프리미티브 |
| @xyflow/react | 캔버스, 노드, 엣지 렌더링 |
| @tiptap/react | 마크다운 에디터 |
| lucide-react | 아이콘 시스템 (shadcn/ui 기본 아이콘) |
| tailwind-merge + clsx | cn() 유틸리티로 조건부 클래스 병합 |

### 4.3 아이콘
- **lucide-react** 아이콘 라이브러리 (shadcn/ui 기본 아이콘 라이브러리)
- 크기: 16px (소형), 20px (기본), 24px (대형)
- 색상: currentColor (부모 텍스트 색상 상속)
- shadcn/ui 컴포넌트 내부에서 자동으로 `[&_svg]:size-4` 적용

## 5. 레이아웃 구조

```
┌──────────────────────────────────────────────────────┐
│  Top Bar (h: 48px)                                    │
│  [☰] LifeMap  [뷰 전환 탭]              [🔍 Cmd+K]   │
├────────┬──────────────────────────┬──────────────────┤
│ Left   │    Main Canvas           │  Right Panel     │
│ Sidebar│    (flex: 1)             │  (w: 320px)      │
│ (w:56px│                          │  (조건부 표시)    │
│  접힘시)│                          │                  │
│(w:240px│                          │                  │
│  펼침시)│                          │                  │
├────────┴──────────────────────────┴──────────────────┤
│  Status Bar (h: 28px)                                 │
└──────────────────────────────────────────────────────┘
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

- 호버 효과: `transition: all 0.15s ease`
- 노드 선택: `ring-2 ring-blue-500` (파란 테두리)
- 패널 슬라이드: `transition: transform 0.2s ease`
- 뷰 전환: `transition: opacity 0.3s ease`
- 줌 애니메이션: React Flow 내장 `fitView` 트랜지션

## 8. shadcn/ui 활용 가이드

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
- LifeMap 전용 스타일은 `className` prop으로 오버라이드
- CSS 변수(`globals.css`)로 테마 색상 통일 관리

---
*최종 수정: 2026-03-04 (shadcn/ui + Radix UI 기반으로 전환)*
