# NEON BREACH V2 CH1 실행 계획

> 날짜: 2026-07-19
>
> 상태: Phase 0 완료, HG-01 권장안 승인 완료
>
> 목표: 현재 8분 전투 엔진을 유지하면서 `영점손해사정` CHAPTER 1을 저장·재도전·서사 전달이 가능한 수직 슬라이스로 완성한다.
>
> 제품 기준: [V2 제품 계약](../specs/2026-07-19-neon-breach-v2-product-contract.md)
>
> 정사 기준: [V2.1 스토리 바이블](../specs/2026-07-19-neon-breach-v2-story.md)

## 1. 백로그 묶음

항목별로 따로 고치지 않고 같은 구조 결함을 해결하는 작업끼리 묶는다.

| Plan slice | 구조 결함 | 흡수하는 항목 |
|---|---|---|
| Slice A | 캠페인 수명주기 경계 없음 | 챕터/런 상태, 저장·진행도, 재시작 |
| Slice B | 서사와 스테이지를 실행하는 계층 없음 | 실제 서사 런타임, 전달 UI, 스테이지 이벤트, 기준 문서 |
| Slice C | 완료를 증명하는 검증 계약 없음 | 테스트, lint, CI, 브라우저 회귀 방지 |
| Slice D | 콘텐츠와 번들이 단일 런에 고정 | 맵·보스·적 다양성, 번들 경고 |

Slice C를 먼저 깔고 A와 B를 구현한다. Slice D는 CH1 사람 검증 뒤에만 시작한다.

## 2. 실행 원칙

1. HG-01 승인 뒤에는 HG-02까지 미세 결정으로 멈추지 않는다.
2. 각 Phase는 독립 커밋이 가능한 크기로 끝낸다.
3. Phase마다 `lint → test → build`를 통과하고 P0/P1 리뷰를 수정한다.
4. 스토리 코드가 들어간 뒤에는 빌드만으로 완료하지 않고 브라우저에서 실제 흐름을 확인한다.
5. 새 추상화는 두 곳 이상에서 실제로 필요한 경우에만 만든다.
6. 사용자 변경과 `.DS_Store`, `.serena/` 같은 무관 파일을 포함하지 않는다.

## Phase 0 — Documentation Discovery와 제품 기준선

**상태:** 완료

### 읽은 문서와 코드

- `src/main.js:45-54,64-131,170-272` — 480초 보스, 결합된 상태, 인라인 화면, 틱·디버그 훅
- `src/hud.js:40-123` — HUD와 범용 전체화면 오버레이 API
- `src/spawner.js:8-65` — 8분 웨이브 데이터와 모듈 전역 누적 상태
- `src/hacking.js:6-35` — 게이지, 최근접 비보스 해킹, 초기화
- `src/allies.js:6-78` — 최대 5기, 최고참 즉시 제거, 초기화
- `src/boss.js:6-81` — 단일 보스 전역 상태와 두 패턴
- `src/enemies.js:138-189` — 적·적탄 정리 API
- `src/weapons.js:184-186`, `src/upgrades.js:53-55`, `src/stats.js:10-16` — 런 초기화 재료
- `package.json:1-16` — Vite/Three.js, test·lint 없음
- `.github/workflows/deploy.yml:1-40` — `main` 푸시 시 build와 Pages 배포
- `.claude/launch.json:5-9` — 포트 5199 패턴, 현재 저장소와 다른 stale `cwd`
- V1 설계·계획과 V2.1 스토리 전체

### Allowed APIs

현재 코드를 그대로 활용한다.

```text
resetSpawner()
resetHacking()
clearAllies()
clearEnemies()
clearEnemyShots()
clearProjectiles()
clearPickups()
resetWeapons()
resetUpgrades()
resetStats()
showOverlay(html)
removeOverlay(div)
window.__game.step(seconds)
```

새 검증 기반은 다음 공식 사용법만 따른다.

- Node 내장 테스트 러너: `node --test`
  - https://nodejs.org/api/test.html
- ESLint flat config: 루트 `eslint.config.js`가 구성 객체 배열을 export
  - https://eslint.org/docs/latest/use/configure/configuration-files

### 없는 API

다음은 현재 존재한다고 가정하지 않는다.

```text
restartRun()
resetPlayer()
resetBoss()
clearEffects()
startChapter(id)
chooseUpgrade(index)
setElapsed(seconds)
snapshot()
StoryEventBus
ProfileStore
```

필요한 것만 해당 Phase에서 명시적으로 추가한다.

### Phase 0 산출물

- 루트 `README.md`
- 루트 `AGENTS.md`
- V1 역사 문서 배너
- V2 제품 계약
- 이 실행 계획

### Anti-pattern guards

- 10개 증상마다 별도 계획 문서를 만들지 않는다.
- V1 문서의 10분 값을 현재 코드에 다시 맞추지 않는다.
- V2.1 승인 전 문서 상태를 임의로 `승인됨`으로 바꾸지 않는다.
- 현재 전투 엔진을 새 프레임워크로 재작성하지 않는다.

## Phase 1 — 검증 기반과 로컬 실행 기준

**목표:** 이후 리팩터링이 전투·저장·서사 규칙을 깨면 즉시 실패하게 만든다.

### 구현

1. `package.json`
   - `test`: `node --test`
   - `lint`: `eslint .`
   - `check`: `npm run lint && npm test && npm run build`
2. `eslint.config.js`
   - ESM, 브라우저·Node 테스트 전역 분리
   - `src/**`, 테스트, Vite 설정만 검사
   - `dist`, `node_modules`와 생성물 제외
3. 개발 의존성
   - `eslint`
   - 브라우저·Node 전역 집합이 필요하면 `globals`
   - 실제 설치 버전은 `package-lock.json`으로 고정
4. `.github/workflows/ci.yml`
   - PR과 작업 브랜치 push에서 Node 20, `npm ci`, `npm run check`
5. `.github/workflows/deploy.yml`
   - 배포 전에 `npm run check`
   - 기존 Pages upload/deploy 단계 유지
6. `.claude/launch.json`
   - stale 절대 경로를 현재 저장소로 수정하거나 `cwd` 의존을 제거
7. 첫 테스트
   - `test/smoke.test.js`에서 Node test runner가 실제 assertion을 실행
   - ESLint가 `src`와 테스트 파일을 실제로 검사하는 smoke

### 문서 참조

- `package.json:6-16`
- `.github/workflows/deploy.yml:18-30`
- Node test runner와 ESLint 공식 문서(Phase 0 링크)

### 검증

```bash
npm run lint
npm test
npm run build
npm run check
```

CI YAML이 `npm run check`를 호출하고, 배포 workflow가 테스트를 건너뛰지 않는지 확인한다.

### Anti-pattern guards

- DOM·Three.js 모듈을 억지로 Node에서 import하지 않는다.
- 첫 Phase에 jsdom·Playwright를 추가하지 않는다.
- 기존 파일 전체를 포맷해 큰 diff를 만들지 않는다.
- Vite 경고를 숨기려고 `chunkSizeWarningLimit`만 올리지 않는다.

## Phase 2 — AppMode·RunState와 새로고침 없는 재시작

**목표:** `main.js`의 상태 결합을 끊고 패배·승리 뒤 같은 페이지에서 깨끗한 런을 시작한다.

### 구현

1. `src/session.js`
   - `APP_MODES`
   - `createRunState(chapterId)`
   - `canTransition(from, to)`
   - 허용된 `transitionAppMode()`
2. 각 소유 모듈의 빠진 초기화
   - `player.js`: `resetPlayer(player)`
   - `boss.js`: `resetBoss()`
   - `effects.js`: `clearEffects()`
   - `weapons.js`: `resetWeapons()`가 데이터 스파이크 mesh까지 scene에서 제거
3. `src/run-lifecycle.js`
   - `resetRuntimeEntities()`
   - `prepareChapter(chapterId)`
   - 제품 계약의 재시작 순서를 그대로 구현
4. `main.js`
   - `game` 객체를 `appMode`와 `runState`로 분리
   - inline `location.reload()` 제거
   - 패배 `다시 시도`와 명시적 재플레이만 `restartChapter()` 호출
   - 승리 결과의 기본 `타이틀로`는 `returnToTitle()` 호출
   - 제목·레벨업·승패 전이를 허용 전이로 제한
5. `kills` 런타임 필드와 `updateHud({ kills })` API를 `blocks`로 변경
6. 시작 무기는 런 준비의 마지막에 한 번만 지급

### 문서 참조

- 제품 계약 `5. 상태 모델`, `7. 런 재시작 계약`
- `src/main.js:47-54,64-131,170-249`
- 기존 reset/clear 함수 목록(Phase 0)

### 테스트

- 모든 AppMode 허용 전이와 금지 전이
- `createRunState('ch1')` 기본값
- 두 번 재시작해도 시작 무기·HUD·엔티티가 중복되지 않음
- 데이터 스파이크 획득 뒤 재시작해도 spike mesh가 남지 않음
- 패배 후 elapsed, blocks, level, xp, boss, 해킹, 아군이 초기화됨
- 패배 `다시 시도`는 briefing, 승리 `타이틀로`는 title로 전이
- 승리 `다시 플레이`는 허용된 victory → briefing 전이
- HUD가 `blocks`만 받고 `kills` API를 더 이상 사용하지 않음
- `rg "location\\.reload" src` 결과 0건

### 브라우저 검증

- 타이틀에서 시작
- 강제 패배
- `다시 시도`
- 새 런에서 HP·타이머·레벨·적·아군이 초기 상태
- 새로고침 없이 두 번 반복

### Anti-pattern guards

- 모든 reset을 `main.js`에서 배열 직접 조작으로 구현하지 않는다.
- 범용 상태 관리 라이브러리나 FSM 패키지를 추가하지 않는다.
- ProfileState를 이 Phase에 섞지 않는다.
- 시작할 때 Three.js renderer를 매번 새로 만들지 않는다.

## Phase 3 — ProfileState 저장·마이그레이션

**목표:** CH1 완료, 대사 `seen`, 기록 보관소와 설정을 런과 분리해 보존한다.

### 구현

1. `src/profile-store.js`
   - `STORAGE_KEY = 'neon-breach.profile'`
   - `CURRENT_SCHEMA_VERSION = 1`
   - `createDefaultProfile()`
   - `loadProfile(storage = localStorage)`은 `{ profile, persistenceMode }` 반환
   - `saveProfile(profile, loadContext)`는 `persistenceMode`를 반드시 검사
   - `migrateProfile(raw)`
2. 저장 값 검증
   - 배열·문자열·완료 기록의 허용 형태만 수용
   - 알 수 없는 필드 제거
3. 손상 데이터
   - 원문 한 번 백업
   - 기본 프로필로 실행
4. 미래 버전 데이터
   - `persistenceMode: 'read-only-future'`로 기본 프로필 실행
   - `saveProfile()` 자체가 쓰기를 거부해 호출자가 검사를 빼먹어도 원본 보존
   - 사용자가 명시적으로 초기화하기 전 원본 보존
5. 저장 시점 연결
   - 이 Phase에서는 M 음소거 변경만 연결
   - 핵심 대사·감사·CH1 승리 producer 연결은 각각 Phase 5·6에서 수행
6. `audio.js`
   - `setMuted(value)` 추가, `toggleMute()`는 이를 재사용
   - 프로필 로드값을 오디오 초기화 전후 동일하게 적용
   - M 토글 결과를 ProfileState에 저장

### 문서 참조

- 제품 계약 `ProfileState`, `6. 저장 계약`
- V2.1 스토리 `8. 패배·재도전·반복 플레이 규칙`
- `src/audio.js:15-19`의 음소거 전환

### 테스트

- 저장값 없음 → 기본 프로필
- 정상 round trip
- 손상 JSON → 백업 + 기본값
- schema 0 → 1 단방향 마이그레이션
- 미래 schema → 원본 보존 + 안전 기본값
- 미래 schema 세션에서 대사·설정 자동 저장 시도 → 원본 불변
- 완료·seen·archive·통신 모드·`settings.muted` 저장
- 저장된 muted=true 로드 → 초기화 전후 실제 오디오 muted 유지
- M 토글 → 오디오 상태와 저장값이 함께 변경
- HP, elapsed, xp, 무기, 아군 등 RunState 필드가 결과 JSON에 없음

### Anti-pattern guards

- 매 프레임 `localStorage.setItem()`을 호출하지 않는다.
- 현재 런 이어하기를 추가하지 않는다.
- 프로필 스키마에서 Three.js 객체나 Set을 직접 직렬화하지 않는다.
- 손상 데이터를 조용히 덮어쓰지 않는다.

## Phase 4 — CH1 콘텐츠 데이터와 StageDirector

**선행 조건:** HG-01 승인

**목표:** 480초 웨이브·보스·서사 트리거를 한 챕터 정의에서 읽고 한 번씩 발생시킨다.

### 구현

1. `src/content/chapter1.js`
   - 제품 계약의 `ChapterDefinition` 형태
   - 현재 `WAVES`를 그대로 이동
   - 보스 시간 480
   - 스토리 바이블의 이벤트 ID·시점·문구
2. `src/content/chapters.js`
   - `CHAPTERS` 레지스트리
   - 실제 구현된 챕터만 `availableChapterIds`에 노출
   - 프로필과 결합해 `availableChapterIds` 계산, 계산값은 저장하지 않음
3. `src/stage-director.js`
   - 이전/현재 elapsed 경계 판정
   - 이벤트 1회 발생
   - boss spawn과 완료 조건 전달
4. `src/story-director.js`
   - 우선순위 큐
   - profile/run replay 정책
   - 위험 시 최대 8초 지연
   - `full | core | off` 통신 필터
   - 재시작 시 큐·지연 타이머·현재 요청을 폐기하는 `reset()`
5. `spawner.js`
   - 비공개 `WAVES` 대신 현재 챕터 waves 입력
   - 스폰 엔진과 콘텐츠 수치 분리

### 문서 참조

- 제품 계약 `ChapterDefinition`, `StoryEvent`, `8. 스테이지·서사 전달 계약`
- `src/spawner.js:8-17,41-64`
- `src/enemies.js:5-11`의 ID 정의 테이블 패턴
- 스토리 바이블 `CHAPTER 1 실제 대사와 연출`

### 테스트

- 웨이브 `until` 오름차순, 마지막 480
- story event ID 중복 없음
- 시간 이벤트가 0~480 범위
- 47.9 → 48.1에서도 00:48 이벤트 한 번
- 한 프레임에 여러 경계를 넘겨도 순서 보존
- 위험 해소 시 대기 통신 표시
- 8초 후 핵심 통신 강제 표시
- 이미 본 profile-once 튜토리얼 생략
- 감사·보스 절차는 반복 가능

### Anti-pattern guards

- 콘텐츠 객체에 `document`, `player`, `boss` 참조나 함수 콜백을 넣지 않는다.
- 범용 pub/sub 이벤트 버스를 만들지 않는다.
- CH2~5 데이터를 미리 빈 템플릿으로 양산하지 않는다.
- 기존 웨이브 숫자를 서사 구현과 동시에 재밸런싱하지 않는다.

## Phase 5 — 스토리 전달 UI와 해킹 대상 표시

**목표:** 레벨업 오버레이와 충돌하지 않는 브리핑·통신·감사·결과 UI를 만든다.

### 구현

1. `src/story-ui.js`
   - `showBriefing(content)`
   - `showComms(event)`은 `{ status: 'completed' | 'cancelled' }` 반환
   - `showAuditCards(cards, options)`도 모든 카드 닫힘/취소 결과 반환
   - `advanceAudit()`
   - `showStoryResult(result)`
   - `openArchive(entries)`
   - `clear()`로 토스트·카드·타이머를 제거하고 pending 호출을 `cancelled`로 종료
   - 완료된 핵심 통신만 profile `seen` 저장 경로에 연결
2. `hud.js`
   - `처치` → `차단`
   - `현장 파견` 수치
   - 스토리 UI가 붙을 DOM root 제공
3. `hacking.js`
   - `findHackTarget(player)`를 `tryHack()`와 UI가 함께 사용
   - 같은 프레임에 표시 대상과 실제 해킹 대상이 달라지지 않게 함
4. 감사 카드
   - AppMode `audit`
   - 카드당 첫 관람 최소 4초
   - 이후 SPACE 진행
   - 이미 본 카드 즉시 진행 허용
5. 앱 입력 라우터
   - `input.js`에 `consumePressed(code)` 추가
   - 게임 `tick()`보다 먼저 `handleAppInput()` 실행
   - `audit` SPACE는 소비 후 `advanceAudit()`, `playing` SPACE만 해킹
   - 차단 모드에서도 `flushInput()` 전에 앱 입력 소비
6. 반복 플레이 통신 설정
   - CH1 결과·타이틀 설정에서 `full | core | off` 선택
   - 첫 플레이 기본값 `full`
   - StoryDirector는 핵심/차단형 이벤트를 보존하며 필터링
7. 접근성 최소선
   - 읽기 가능한 대비
   - 캡션 겹침 방지
   - 키보드만으로 모든 차단형 UI 진행

### 문서 참조

- 제품 계약 `Story UI` 표
- `src/hud.js:1-123`
- `src/main.js:64-131`의 기존 overlay 패턴
- 스토리 바이블 `7. CHAPTER 1 실제 대사와 연출`

### 테스트·검증

- StoryDirector 이벤트가 올바른 UI 종류에 전달
- 통신 이벤트는 AppMode를 playing에서 바꾸지 않음
- 감사 UI만 audit로 전환하고 닫은 뒤 playing 복귀
- levelup 중 통신이 뒤에서 중복 표시되지 않음
- 키보드 SPACE 한 번에 한 카드만 진행
- UI 완료 전 `seen`·저장 없음, 완료 뒤 한 번만 기록
- `clear()` 취소 결과는 settle되지만 `seen`·저장 없음
- 마지막 감사 카드 SPACE가 같은 프레임 해킹으로 재사용되지 않음
- `full | core | off`별 통신 필터와 필수 카드 유지
- 재시작 뒤 이전 통신·카드·타이머가 다시 나타나지 않음
- 브라우저에서 4개 통신 위치·줄바꿈·겹침 확인

### Anti-pattern guards

- 모든 UI를 `showOverlay(html)` 한 함수로 합치지 않는다.
- 대사를 `main.js` template literal에 복사하지 않는다.
- `innerHTML`에 프로필이나 외부 입력을 삽입하지 않는다.
- 통신 때문에 일반 전투를 매번 일시정지하지 않는다.

## Phase 6 — CH1 스토리·게임플레이 통합

**목표:** 스토리의 선택과 비용이 실제 전투 결과로 보이게 한다.

### 구현

1. 첫 해킹
   - 성공 결과에 대상 정보 반환
   - `first-hack` 이벤트
   - 동부17 목적지 통신
2. 여섯 번째 해킹
   - `addAlly()`가 `{ added, dispatched }` 결과 반환
   - 최고참을 즉시 삭제하지 않고 화면 밖 파견 상태로 전환
   - `allies.js`가 이탈 중 mesh·타이머를 소유하고 `clearAllies()`가 함께 정리
   - 전투력 1기 감소, `현장 파견` 증가
3. 시간 통신
   - 00:48, 02:24, 04:24, 06:48
4. 보스 등장
   - 판정 코어의 영점 지침 낭독
5. 보스 50%
   - 한 번만 정책 노드 생성
   - 노드 해킹 전 보스 무적
   - 해킹 대상 계약을 `{ kind: 'enemy' | 'policy-node', entity }`로 확장
   - 활성 정책 노드는 범위 안에서 일반 적보다 우선 표적
   - 정책 노드는 표준 해킹 게이지 검사·소비 없이 `resolvePolicyNode()`로 처리
   - `tryHack()`의 일반 적 게이지 검사보다 정책 노드 분기를 먼저 실행
   - 모든 보스 피해는 `applyBossDamage(amount)`를 통과
   - 미해결 상태에서 50%를 가로지르는 피해는 HP를 50%로 clamp하고 사망 이벤트 금지
   - 해킹 뒤 감사 카드 두 장
6. 승리
   - 기존 `시스템 장악 완료` 제거
   - 동부17 호송·124명·중앙 자원 거부 표시
   - CH1 완료·archive·CH2 진행 자격 저장
   - 감사 카드 완료와 승리 확정 시 profile 저장 경로 연결
7. 패배
   - 진행도 해금 없음
   - `다시 시도`

### 문서 참조

- 스토리 바이블 `CHAPTER 1`, `CHAPTER 1 실제 대사와 연출`, `첫 구현 범위`
- 제품 계약 `9. CH1 구현 계약`
- `src/hacking.js:14-30`
- `src/allies.js:12-34`
- `src/boss.js:27-80`
- `src/main.js:194-228`

### 테스트

- 첫 해킹 이벤트 1회
- 여섯 번째 해킹 시 아군 5, 파견 1
- 일곱 번째 해킹 시 아군 5, 파견 2
- 파견 드론 이탈 중 재시작 → active/departing 배열·mesh·타이머 0
- 보스 50% 정책 노드 1회
- 노드 전 보스 피해 차단, 해킹 뒤 재개
- 정책 노드는 적 제거·아군 추가 없이 `resolvePolicyNode()` 1회
- 해킹 게이지 0에서도 정책 노드 해결, 처리 전후 표준 게이지 불변
- HP 51%에서 치명타를 받아도 50% clamp·생존·노드 1회
- 승리만 CH1 완료 저장
- 패배 후 ProfileState 불변
- 다시 시도 뒤 모든 RunState 초기화

### 브라우저 검증

- 해킹 대상 표식과 실제 대상 일치
- 최고참 드론이 전장 밖으로 이동
- 감사 카드 동안 적·탄환 정지
- 카드 종료 후 전투 정상 재개
- 승리 결과에서 스토리 문구와 파견 수치 확인

### Anti-pattern guards

- 보스 전체를 새로 쓰지 않는다.
- 여섯 번째 아군을 mesh만 지우고 파견으로 이름만 바꾸지 않는다.
- 감사 로그를 1.5초 토스트로 축약하지 않는다.
- CH1 승리에서 플레이 불가능한 CH2 버튼을 활성화하지 않는다.

## Phase 7 — 자동 QA, 전체 런, HG-02

**목표:** 기능적으로 맞는 것과 실제로 읽히고 재미있는 것을 분리해 검증한다.

### 구현·도구 보강

1. `@playwright/test`와 `playwright.config.js`
   - `package.json`에 `test:e2e`, `check:full` 스크립트 추가
   - `webServer`가 고정 포트·`--strictPort`로 Vite 개발 서버를 시작하고 종료
   - debug API는 `import.meta.env.DEV`에서만 노출하고 프로덕션 build에는 제거
   - Chromium 한 프로젝트, CI worker 1
   - 실패 시 screenshot·trace를 `test-results/`에 보존
2. `tests/e2e/ch1.spec.js`
   - 아래 2~9 흐름을 debug API로 재현하고 DOM·상태·콘솔을 assert
3. `docs/testing/evidence/ch1/`
   - 치트 없는 전체 런 체크리스트, 날짜·빌드 hash·결과·스크린샷 경로 기록
4. CI
   - Chromium 설치 후 `npm run check:full`
   - `test-results/`는 gitignore, 실패 CI artifact로만 업로드

Playwright 구성은 공식 `webServer`, `outputDir`, 실패 trace/screenshot 계약을 따른다.

- https://playwright.dev/docs/test-configuration
- https://playwright.dev/docs/test-webserver

개발 모드에서만 다음 debug API를 제공한다.

```text
window.__game.startChapter(id)
window.__game.restartChapter()
window.__game.step(seconds)
window.__game.chooseUpgrade(index)
window.__game.setElapsed(seconds)
window.__game.setBossHpRatio(ratio)
window.__game.setPlayerHp(hp)
window.__game.spawnEnemies(count, type)
window.__game.snapshot()
```

프로덕션 빌드에서는 치트형 setter를 노출하지 않는다.

### 자동 검증 순서

1. `npm run check`
2. `npm run test:e2e`로 타이틀·브리핑 smoke
3. 각 시간 이벤트 경계 자동 이동
4. 첫·여섯 번째 해킹
5. 보스 등장·50%·승리
6. 패배·다시 시도
7. localStorage reload 후 프로필 복구
8. 콘솔 오류 0
9. 150개체 성능 확인
10. 프로덕션 preview에서 치트 없는 8분 전체 런 1회는 사람이 아니라 에이전트가 수동 플레이하고 증거 문서 저장

### 에이전트 평가

- P0: 진행 불가, 저장 손상, 정사 위반, 서사 이벤트 누락
- P1: 재시도 회귀, 읽기 불가, 중복 이벤트, 성능 악화
- P2: 세부 연출, 미세 밸런스, 번들 경고

P0/P1은 HG-02 전에 모두 수정한다. P2는 목록과 체감 영향을 함께 제시한다.

### HG-02

제품 계약의 사람 검증 질문으로 한 번만 승인받는다. 통과 전 CH2를 시작하지 않는다.

### Anti-pattern guards

- 오토파일럿 통과를 사람 플레이 대체로 취급하지 않는다.
- debug API로만 가능한 흐름을 완료로 보고하지 않는다.
- P1을 `후속 작업`으로 미루고 게이트를 요청하지 않는다.
- Playwright report 자체를 커밋하지 않고 실패 증거와 최종 체크리스트만 보존한다.

## Phase 8 — CH1 공개 후보와 HG-03

**선행 조건:** HG-02 통과

1. `npm run check`와 `npm run test:e2e` 재실행
2. 프로덕션 빌드에서 debug setter가 노출되지 않는지 확인
3. CH1 전체 런·콘솔 오류 0·저장 복구 증거 확인
4. 공개 문구, 제품명, `다음 장 준비 중` 예고, 민감성 문구 확정
5. 알려진 P2와 현재 번들 크기를 릴리스 노트에 기록
6. HG-03 승인
7. 승인 뒤에만 `main` 반영·Pages 배포

HG-03은 공개 행위에 대한 승인이다. HG-02가 자동으로 공개 권한을 뜻하지 않는다.

## Phase 9 — CH2~5 확장

**선행 조건:** HG-02 통과. CH1을 공개할 필요 없이 내부 개발은 시작할 수 있다.

CH2부터는 챕터 하나를 한 수직 슬라이스로 반복한다.

1. 스토리 바이블에서 해당 챕터의 고유 행동을 확정
2. `ChapterDefinition` 추가
3. 기존 Director와 UI로 이벤트 연결
4. 필요한 적·보스 변화만 제한적으로 추가
5. 단위 테스트·브라우저 smoke·전체 챕터 런
6. 프로필 완료·기록 보관소 연결

CH2 기록 운반, CH3 호송, CH4 증거 송출, CH5 정책 노드는 서로 다른 플레이 동사를 가져야 한다. 단순히 대사와 적 수치만 바꾼 복제 챕터를 만들지 않는다.

개발 휴먼 게이트는 챕터마다 만들지 않는다. HG-02에서 수직 슬라이스 문법이 승인되면 CH2~5는 계약 안에서 연속 구현한다. 다만 각 챕터를 외부에 공개할 때는 HG-03을 반복한다.

## Phase 10 — P2 콘텐츠·번들·캠페인 공개

### 콘텐츠

- 맵·적·보스 다양성은 각 챕터 고유 행동을 지지할 때만 추가
- 외부 에셋은 HG-C2 없이 추가하지 않음

### 번들

- 현재 기준: JS 약 513.8KB, gzip 약 133.2KB
- CH1 동안 gzip 크기가 기준 대비 10% 이상 증가하지 않게 추적
- CH1 이후 실제 로딩·캐시 측정으로 분리 대상을 결정
- 경고만 숨기는 설정 변경 금지

### 캠페인 공개

1. 전체 `npm run check`
2. 브라우저 전체 런과 콘솔 오류 0
3. 캠페인 전체 서사·민감성·제품명 최종 확인
4. HG-03 승인
5. 그 뒤에만 `main` 반영·Pages 배포

## 최종 검증 매트릭스

| 영역 | 자동 증거 | 브라우저 증거 | 사람 게이트 |
|---|---|---|---|
| 상태·재시작 | 전이·reset 테스트 | 패배 후 2회 다시 시도 | 없음 |
| 저장 | round trip·손상·migration | reload 후 진행도 유지 | 파괴적 변경만 HG-C1 |
| 시간 이벤트 | 경계·중복 테스트 | 4개 통신 확인 | 없음 |
| 해킹·파견 | 1·6·7회 테스트 | 대상 표식·이탈 연출 | HG-02 체감 |
| 감사 카드 | pause·replay 테스트 | 50% 보스 흐름 | HG-02 가독성 |
| 서사 이해 | 정사 이벤트 완전성 | 전체 CH1 런 | HG-02 |
| 성능 | build·크기 기록 | 150개체·전체 런 | 없음 |
| 공개 | CI 전체 통과 | 배포 후보 확인 | HG-03 |

## 권장 커밋 경계

1. `docs: define V2 product contract and execution gates`
2. `test: add lint, node test runner, and CI gate`
3. `refactor: separate app mode and restartable run state`
4. `feat: persist versioned campaign profile`
5. `feat: add CH1 content and story directors`
6. `feat: add narrative HUD and audit presentation`
7. `feat: integrate CH1 rescue events and policy node`
8. `test: verify complete CH1 vertical slice`

각 커밋은 해당 Phase 검증을 통과한 뒤 만든다. 다음 Phase가 이전 실패를 숨기도록 한꺼번에 묶지 않는다.
