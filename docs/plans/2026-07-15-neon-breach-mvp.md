# NEON BREACH MVP 구현 계획

> **작업 에이전트 참고:** 필수 서브 스킬 — superpowers:subagent-driven-development(권장) 또는 superpowers:executing-plans를 사용해 이 계획을 태스크 단위로 구현할 것. 진행 상황은 체크박스(`- [ ]`)로 추적한다.

**목표:** 사이버펑크 해커 서바이버라이크 웹 게임 — 10분 생존, 적 해킹→아군화 메커닉, 픽셀아트×네온 블룸.

**아키텍처:** 게임 로직은 순수 JS 평면 좌표(x,y)로 처리하고 Three.js는 렌더링 전담(직교 카메라 + UnrealBloomPass). 스프라이트는 오프스크린 캔버스에 코드로 찍은 픽셀아트를 NearestFilter 텍스처로 사용. HUD/메뉴는 DOM 오버레이. 엔티티는 배열 + 오브젝트 풀링.

**기술 스택:** Vite, JavaScript(ESM), Three.js (블룸: three/addons의 UnrealBloomPass)

## 공통 제약

- 픽셀 스프라이트 기준 16×16, NearestFilter, 정수 배율 — 픽셀 뭉개짐 금지
- 적 150마리 동시 표시에서 60fps (풀링 필수, per-frame 할당 최소화)
- 외부 이미지/오디오 에셋 금지 — 모든 비주얼은 코드 생성
- UI 텍스트는 한국어
- 게임플레이 검증은 브라우저 실행 + 콘솔 에러 0 기준 (Browser 도구로 확인)
- 태스크 완료마다 커밋

## 밸런스 상수 (설계 문서 확정값)

- 런 길이 10:00, 보스 등장 10:00
- 해킹 게이지: 일반 처치 +5%, 엘리트 처치 +20%, 100%에서 Space로 발동
- 아군 최대 5기, 초과 시 최고참 소멸
- 무기 레벨 1~5, 레벨업 선택지 3장
- 패시브 5종: 이동속도/공격력/쿨다운감소/획득범위/최대HP (레벨당 +10%, 최대HP는 +20)

---

### 태스크 1: 프로젝트 스캐폴드 + 블룸 렌더러

**파일:**
- 생성: `package.json`, `index.html`, `src/main.js`, `src/renderer.js`

**인터페이스:**
- 제공: `createRenderer(canvas) → { scene, camera, render(dt), addSprite, removeSprite }` — camera는 OrthographicCamera(월드 단위 높이 240px 기준), render는 bloom composer 경유

- [ ] `npm create vite` 없이 수동 package.json (vite, three) 작성 후 `npm install`
- [ ] `renderer.js`: 씬/직교카메라/WebGLRenderer/EffectComposer(RenderPass + UnrealBloomPass strength≈0.9, threshold≈0.35) 셋업. 리사이즈 대응.
- [ ] `main.js`: requestAnimationFrame 루프 + 테스트용 발광 사각형 1개 표시
- [ ] 검증: `npx vite` → 브라우저에서 글로우 사각형 확인, 콘솔 에러 0
- [ ] 커밋 `feat: Vite+Three.js 스캐폴드, 블룸 렌더러`

### 태스크 2: 프로시저럴 픽셀 스프라이트

**파일:**
- 생성: `src/sprites.js`

**인터페이스:**
- 제공: `makeSprite(name, frame=0) → THREE.Texture` (캐시됨), 이름: `player`(2프레임 걷기), `rushbot`, `shooterbot`, `tankbot`, `elite`, `ally`, `boss`, `gem`, `bullet`, `missile`, `spike`
- 팔레트 상수: 플레이어 시안 `#00e5ff`, 적 마젠타 `#ff2d78`, 아군 민트 `#00ffc8`, XP 보라 `#b44dff`, 탄 노랑 `#ffe600`

- [ ] 문자열 배열 픽셀맵 → 오프스크린 캔버스 → CanvasTexture(NearestFilter) 생성기 구현
- [ ] 11종 스프라이트 정의 (적들은 실루엣 차별화: 돌진=삼각, 슈터=십자, 탱크=사각 덩치, 엘리트=크고 발광 코어, 보스=32×32)
- [ ] main.js에 전 스프라이트 나열 표시하는 임시 갤러리로 검증 (픽셀 또렷한지)
- [ ] 커밋 `feat: 프로시저럴 픽셀 스프라이트 11종`

### 태스크 3: 입력 + 플레이어 이동 + 카메라

**파일:**
- 생성: `src/input.js`, `src/player.js`
- 수정: `src/main.js` (갤러리 제거, 게임 상태 도입)

**인터페이스:**
- `input.js` 제공: `keys` Set, `axis() → {x,y}` (WASD/화살표 정규화), `wasPressed(code)`
- `player.js` 제공: `createPlayer() → { x,y,hp,maxHp,speed,facing, update(dt,axis), takeDamage(n) }` — 기본 이동속도 초당 90유닛(`speed: 90`), 최대 HP 100, 피격 무적 0.5초
- 배경: 어두운 타일 그리드(발광 없는 라인) 무한 스크롤 느낌으로 카메라가 플레이어 추적

- [ ] 이동 + 걷기 애니메이션(2프레임 토글) + 좌우 반전 + 카메라 추적 구현
- [ ] 검증: 브라우저에서 8방향 이동 부드러움 확인
- [ ] 커밋 `feat: 입력/플레이어 이동/카메라 추적`

### 태스크 4: 적 스폰 + 추적 AI + 접촉 데미지

**파일:**
- 생성: `src/enemies.js`, `src/spawner.js`
- 수정: `src/main.js`, `src/hud.js`(생성: HP바만 먼저)

**인터페이스:**
- `enemies.js` 제공: `enemies` 배열, `spawnEnemy(type, x, y)`, `updateEnemies(dt, player)`, `damageEnemy(e, n) → 사망 여부`. 타입 테이블: `rushbot{hp:20,speed:55,dmg:8}`, `shooterbot{hp:15,speed:40,dmg:6,range:120}`, `tankbot{hp:80,speed:22,dmg:15}`, `elite{hp:200,speed:45,dmg:12}` (시간 배율은 spawner가 적용)
- `spawner.js` 제공: `updateSpawner(dt, elapsed, player)` — 분 단위 웨이브 테이블(0분: rushbot만 0.8/s → 9분: 혼합 4/s + 엘리트 30s마다), 화면 밖 링 스폰
- 충돌: 원 대 원 (반경 스프라이트 절반), 적끼리 간단 분리(separation)

- [ ] 적 이동/충돌/플레이어 피격(무적시간 포함)/사망 시 게임오버 오버레이(DOM) 구현
- [ ] 검증: 적이 몰려오고, 부딪히면 HP 감소, 0이면 "접속 종료" 화면
- [ ] 커밋 `feat: 적 스폰/추적/접촉 데미지/게임오버`

### 태스크 5: 무기 시스템 + 펄스 SMG + 적 사망 처리

**파일:**
- 생성: `src/weapons.js`, `src/projectiles.js`

**인터페이스:**
- `weapons.js` 제공: `ownedWeapons` 배열, `addWeapon(id)`, `upgradeWeapon(id)`, `updateWeapons(dt, player, enemies)`. 무기 정의 테이블: `{ id, name, desc, cooldown, fire(level, player, ctx) }`
- `projectiles.js` 제공: 풀링된 발사체 `fireProjectile({x,y,vx,vy,dmg,pierce,life,sprite})`, `updateProjectiles(dt, enemies)` — 명중 시 `damageEnemy`, 발광 스프라이트로 블룸 적용
- SMG: 가장 가까운 적 방향 연사, cooldown 0.35s(레벨당 -8%), dmg 8(+3/lv), 레벨3부터 2발 부채꼴

- [ ] SMG 자동 조준 사격 + 적 사망(스프라이트 플래시 후 제거) 구현
- [ ] 검증: 자동 사격으로 적 처치 가능, 150마리 스폰 치트로 프레임 확인
- [ ] 커밋 `feat: 무기 프레임워크 + 펄스 SMG`

### 태스크 6: XP 픽업 + 레벨업 + 업그레이드 선택 UI

**파일:**
- 생성: `src/pickups.js`, `src/upgrades.js`
- 수정: `src/hud.js` (XP바/레벨/타이머/처치수 추가)

**인터페이스:**
- `pickups.js` 제공: `dropGem(x,y,xp)`, `updatePickups(dt, player) → gainedXp` — 획득범위 내 자석 흡인
- `upgrades.js` 제공: `xpForLevel(n) = 10 + (n-1)*8`, `rollChoices() → [3개]` (신규무기/무기강화/패시브 풀에서 중복 없이), `applyChoice(c)`; 패시브 스탯은 `stats` 객체(`speedMul, dmgMul, cdMul, pickupRange, maxHpBonus`)로 노출
- 레벨업 시: 게임 일시정지 → DOM 카드 3장 → 선택 → 재개

- [ ] 젬 드랍/흡인/레벨업 오버레이/선택 적용 구현
- [ ] 검증: 레벨업 루프가 돌고 선택이 실제 반영(SMG 강화 시 연사 증가 확인)
- [ ] 커밋 `feat: XP/레벨업/업그레이드 선택`

### 태스크 7: 나머지 무기 4종

**파일:**
- 수정: `src/weapons.js`, `src/projectiles.js`

**인터페이스 (무기 사양):**
- EMP 노바: 3.5s마다 반경 60(+8/lv) 원형 파동, dmg 12(+4/lv) — 확장 링 이펙트
- 유도 미사일: 2.2s마다 무작위 적 추적탄 1발(+1/2lv), 폭발 반경 30, dmg 20(+6/lv)
- 관통 레이저: 2.8s마다 조준 방향 직선빔(즉발, 0.15s 표시), 관통 무제한, dmg 15(+5/lv)
- 데이터 스파이크: 궤도 회전체 1개(+1/lv), 반경 40, 접촉 dmg 10(+3/lv), 상시

- [ ] 4종 구현 + 각각 블룸 발광 이펙트
- [ ] 검증: 치트로 전 무기 획득 후 5종 동시 발동 화면/프레임 확인
- [ ] 커밋 `feat: 무기 5종 완성`

### 태스크 8: 슈터봇 탄환 + 해킹 시스템 + 아군 AI

**파일:**
- 생성: `src/hacking.js`, `src/allies.js`
- 수정: `src/enemies.js` (슈터봇 발사), `src/hud.js` (해킹 게이지)

**인터페이스:**
- `hacking.js` 제공: `gauge (0~100)`, `addCharge(isElite)`, `tryHack(player, enemies) → 성공 여부` — 반경 100 내 최근접 적을 아군화, 엘리트 우선 아님(순수 최근접)
- `allies.js` 제공: `allies` 배열(최대 5, 초과 시 shift), `updateAllies(dt, player, enemies)` — 플레이어 주위 배회, 반경 140 내 적 자동 교전(원 스탯 계승, 민트 리컬러 + 발광 코어)
- 슈터봇: range 내에서 1.8s마다 플레이어 방향 적탄(속도 80, dmg 6) — 적탄은 마젠타 발광

- [ ] 게이지 충전/Space 발동/전향 연출(EMP 링 + 색 전환)/아군 전투 구현
- [ ] 검증: 탱크봇 해킹 → 아군 탱크가 적 막는 것 확인, 6번째 해킹 시 최고참 소멸
- [ ] 커밋 `feat: 해킹→아군화 시스템`

### 태스크 9: 보스 + 승리/패배 + 타이틀 화면

**파일:**
- 생성: `src/boss.js`
- 수정: `src/main.js`, `src/hud.js`, `index.html`

**인터페이스:**
- `boss.js` 제공: `spawnBoss(player)`, `updateBoss(dt, player) → 생존 여부` — hp 3000, 32×32 스프라이트, 패턴 교대: ① 예고선(1s 발광 라인) 후 돌진 ② 원형 탄막 16발 × 3연사. 보스 HP바 상단 표시
- 게임 상태 머신: `title → playing → levelup → gameover | victory` (main.js에 `state` 전역)
- 타이틀: 게임명 + "출격" 버튼 + 조작법, 승리: "시스템 장악 완료" + 기록, 패배: "접속 종료" + 재시작

- [ ] 10:00 보스 등장(일반 스폰 정지), 패턴 2종, 처치 시 승리 화면 구현
- [ ] 검증: 치트(시간 스킵)로 보스전 전체 흐름 확인
- [ ] 커밋 `feat: 보스전 + 타이틀/승리/패배 화면`

### 태스크 10: 성능/폴리시 마감

**파일:**
- 수정: 전 파일 대상 (풀링 점검), `src/renderer.js`

**단계:**
- [ ] 발사체/젬/적 스프라이트 메시 풀링 확인, per-frame `new` 제거
- [ ] 파티클(사망 픽셀 파편, 해킹 링) 추가 — 풀링
- [ ] 화면 흔들림(피격 시 3px, 보스 등장 시), 히트 플래시
- [ ] 검증: 9분대 시나리오에서 적 150+ 표시 상태 성능 확인 (Browser로 실측), 콘솔 에러 0
- [ ] 10분 풀런 1회 완주 (치트 없이 밸런스 체감 점검, 과하게 어려우면 스폰율 -20% 조정 허용)
- [ ] 커밋 `feat: 파티클/폴리시/성능 마감`

---

## 자체 검토 결과

- 설계 문서 커버리지: 무기5/패시브5/적4/보스/해킹/화면흐름/검증기준 → 태스크 5~10에 모두 매핑됨. 모바일·사운드·메타진행은 설계 문서의 범위 외 그대로 제외.
- 타입 일관성: `damageEnemy`(태스크 4)를 태스크 5/7/8이 사용, `stats`(태스크 6)를 태스크 5 무기 데미지 계산이 곱연산으로 사용 — 시그니처 통일 확인.
- 게임 코드 특성상 단계별 검증은 유닛테스트 대신 브라우저 실행 검증(콘솔 에러 0 + 체크 항목)으로 정의함 — 순수 로직(xpForLevel, rollChoices, 웨이브 테이블)은 구현 중 콘솔 assert로 확인.
