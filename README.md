# NEON BREACH — 영점손해사정

현재 저장소에는 8분짜리 V1 전투 엔진이 실행 가능하며, V2.1 캠페인 `영점손해사정`의 CHAPTER 1 수직 슬라이스를 설계 중이다.

## 현재 상태

- 실행 가능: V1 전투 루프, 8분 웨이브, 보스, 해킹 아군화, 레벨업
- 작성 완료·HG-01 승인: V2.1 전체 서사와 CH1 대사·연출
- 구현 전: 챕터 상태, 프로필 저장, 스토리 이벤트, 전용 서사 UI, 재시작 수명주기
- 공개 상태: V2.1은 아직 공개 데모가 아니다.

## 실행

```bash
npm install
npm run dev -- --port 5199 --strictPort
```

```bash
npm run build
```

## 문서 우선순위

1. [V2 제품 계약](docs/specs/2026-07-19-neon-breach-v2-product-contract.md) — 제품 범위, 상태 모델, 휴먼 게이트
2. [V2.1 스토리 바이블](docs/specs/2026-07-19-neon-breach-v2-story.md) — 정사, 인물, 챕터, 실제 대사
3. [V2 실행 계획](docs/plans/2026-07-19-neon-breach-v2-execution-plan.md) — 구현 순서와 단계별 검증
4. [V1 설계](docs/specs/2026-07-15-neon-breach-design.md), [V1 구현 계획](docs/plans/2026-07-15-neon-breach-mvp.md) — 역사 기준과 재사용 가능한 엔진 제약

V1과 V2가 충돌하면 V2 제품 계약과 V2.1 스토리 바이블을 따른다. V1의 `10분`, `내 군대`, `최고참 소멸`은 V2 구현 기준이 아니다.

## 배포 주의

`.github/workflows/deploy.yml`은 `main` 푸시 시 GitHub Pages를 배포한다. 브랜치 작업과 로컬 검증은 자동 진행할 수 있지만, `main` 반영과 공개 배포는 제품 계약의 출시 휴먼 게이트를 통과해야 한다.
