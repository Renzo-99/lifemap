# CLAUDE.md — 기본 지침서

> 이 문서는 모든 프로젝트에서 코드를 분석, 작성, 수정할 때 지켜야 할 대원칙을 정의한다.
> 프로젝트 진행에 따라 지속적으로 업데이트한다.

## 1. 언어 원칙

- **반드시 한국어로 대답**한다. 사고 과정, 설명, 커밋 메시지, 주석 모두 한국어 사용
- 코드 내 변수명/함수명은 영문 (camelCase), UI 텍스트와 주석은 한국어
- 기술 용어는 원문 유지 가능 (예: "React Flow", "Zustand", "localStorage")

## 2. 코드 작성 원칙

### 2.1 스타일 가이드
- **Google TypeScript Style Guide** 준수
- ESLint + Prettier 설정 따름
- 들여쓰기: 2 spaces
- 세미콜론 사용
- 문자열: 작은따옴표 (`'`) 우선
- 타입 정의: `interface` 우선 (type alias는 유니온/교차 타입에만)

### 2.2 모듈화 원칙
- 모든 기능을 적절한 단위로 나누어 모듈화하고, 각 모듈에 명확한 이름을 부여
- 특정 기능 수정 시 다른 모듈이 영향받지 않도록 **독립성 확보**
- **RESTful API 설계 원칙**을 절대적으로 따름
- 내부 API를 적극 활용하여 모듈 간 통신
- 컴포넌트 단일 책임 원칙 (SRP): 하나의 컴포넌트는 하나의 역할
- 커스텀 훅으로 로직과 UI 분리

### 2.3 파일 구조
- 기능별 디렉토리 구조 유지 (`components/nodes/`, `components/panels/` 등)
- 타입 정의는 `types/index.ts`에 중앙 관리
- 상수는 `lib/constants.ts`에 중앙 관리
- 유틸 함수는 `lib/` 하위에 목적별 파일로 분리
- Supabase 클라이언트는 `lib/supabase/` 하위에 client.ts(브라우저), server.ts(서버) 분리
- UI 컴포넌트는 `components/ui/`에 shadcn/ui 규격으로 관리

### 2.4 shadcn/ui 사용 규칙
- UI 컴포넌트는 shadcn/ui 패턴을 따름 (Radix UI + cva + cn 유틸)
- 새 UI 컴포넌트 추가 시 `components/ui/`에 생성하고 DESIGN.md 업데이트
- shadcn/ui 기본 스타일을 최대한 유지, 커스터마이징은 className으로

### 2.5 Supabase 사용 규칙
- 브라우저 환경: `lib/supabase/client.ts`의 `createClient()` 사용
- 서버 환경 (Server Component, Route Handler): `lib/supabase/server.ts`의 `createClient()` 사용
- 환경 변수는 `.env.local`에 저장, `.env.local.example` 참고
- `.env.local`은 절대 커밋하지 않음

### 2.6 배포
- Vercel 자동 배포 (GitHub main 브랜치 push 시)
- 환경 변수는 Vercel Dashboard에서 별도 설정

## 3. 구현 원칙

### 3.1 보수적 구현
- **요청한 내용에 대해서만 최소한으로 구현**
- 임의로 관련 기능을 추가하지 않음
- "있으면 좋을 것 같은" 기능을 마음대로 구현하지 않음
- 한 번에 하나의 기능만 집중 구현

### 3.2 과도한 일반화 금지
- 특정 필드/케이스용 로직을 만들 때 다른 필드에 적용하지 않음
- 현재 필요한 케이스에만 최적화
- 미래에 필요할 수도 있는 추상화를 미리 만들지 않음

### 3.3 토큰 절약
- 불필요한 .md 가이드 파일 생성 금지
- .md 파일에 불필요한 예시 코드 작성 금지
- 설명이 필요하면 기존 문서에 추가

## 4. 트러블슈팅 원칙

- 오류 수정 시 **근본 원인 파악** 필수
- 임시/우회 방편이 아니라 같은 오류가 재발하지 않는 방식으로 수정
- 수정 후 재발 방지 지침을 이 CLAUDE.md에 업데이트
- 디버깅 과정에서 발견한 패턴은 아래 "알려진 문제 패턴" 섹션에 기록

## 5. Git 규칙

- 커밋 메시지: 한국어, 명확한 변경 내용 기술
- 브랜치 전략: `main` → `feature/기능명` → PR
- 불필요한 파일 커밋 금지 (.env, .env.local, node_modules, .next 등)
- GitHub 연동: `gh` CLI 활용, Vercel 자동 배포와 연계

## 6. 알려진 문제 패턴

> 프로젝트 진행 중 발견된 오류 패턴과 해결 방법을 기록한다.

- **React Flow 타입 호환**: `LifeMapNodeData`, `LifeMapEdgeData`는 `interface`가 아닌 `type`으로 정의하고 `[key: string]: unknown` 인덱스 시그니처를 포함해야 React Flow의 `Record<string, unknown>` 제약을 만족함
- **shadcn/ui 레지스트리 접근 불가 시**: `npx shadcn@latest add` 대신 공식 문서에서 코드를 복사하여 `components/ui/`에 수동 생성

---
*최종 수정: 2026-03-04 (Supabase + shadcn/ui + Vercel 스택 반영)*
