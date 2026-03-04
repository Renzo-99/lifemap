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

### 2.1 기본 색상
```css
:root {
  /* 배경 */
  --bg-primary: #FAFBFC;        /* 캔버스 배경 */
  --bg-secondary: #FFFFFF;       /* 패널 배경 */
  --bg-tertiary: #F4F5F7;       /* 사이드바 배경 */

  /* 텍스트 */
  --text-primary: #191F28;
  --text-secondary: #4E5968;
  --text-tertiary: #8B95A1;

  /* UI */
  --border: #E5E7EB;
  --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --radius: 12px;
  --radius-sm: 8px;
}
```

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

### 4.1 자체 구현 컴포넌트 (`components/ui/`)
직접 Tailwind CSS로 구현하는 기본 UI 컴포넌트:
- `Button` — 버튼 (primary, secondary, ghost, icon 변형)
- `Input` — 텍스트 입력
- `Select` — 드롭다운 선택
- `Modal` — 모달 다이얼로그
- `Tooltip` — 툴팁
- `Badge` — 태그/뱃지

### 4.2 외부 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| @xyflow/react | 캔버스, 노드, 엣지 렌더링 |
| @tiptap/react | 마크다운 에디터 |
| lucide-react | 아이콘 시스템 |
| tailwind-merge + clsx | 조건부 클래스 병합 |

### 4.3 아이콘
- **lucide-react** 아이콘 라이브러리 사용
- 크기: 16px (소형), 20px (기본), 24px (대형)
- 색상: currentColor (부모 텍스트 색상 상속)

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

---
*최종 수정: 2026-03-04*
