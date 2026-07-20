# CH1 검증 증거

- 실행 시각(UTC): 2026-07-19T11:34:22Z
- 기준 HEAD: `adc50c9` (검증 시 working tree 변경 포함)
- 번들: Vite production build, `535.40 kB` minified / `140.81 kB` gzip
- production debug API 검사: 통과 (`npm run verify:prod`)
- 정적 검증: lint 통과, Node 테스트 27/27 통과
- Playwright Chromium: 4/4 통과
  - 타이틀 → 브리핑 → 플레이
  - 시간 경계 이벤트 1회 발생
  - 보스 정책 노드 → 감사 카드 → 승리
  - 패배 → `다시 시도` → 새 런
- 콘솔 오류: 위 4개 시나리오에서 0건
- 자동 증거 출력: `test-results/` (실패 시에만 보존; 성공 report는 커밋하지 않음)

## 2026-07-19 23:28 KST 재검증

- `npm run check`: 통과
  - ESLint 통과
  - Node 테스트 27/27 통과
  - production build 통과 (`535.75 kB` minified / `140.97 kB` gzip)
- `npm run check:full`: 최초 실행에서 Playwright 4/4 포함 전체 통과
- production preview에서 DEV debug API 없이 두 차례 재도전
  - 두 차례 모두 00:09, HP 4/100에서 패배
  - 브라우저 제어가 WASD keydown 유지 시간을 제공하지 않아 이동 검증 불가
  - 콘솔 오류 0건
- 이후 headless WebGL이 느려진 상태에서는 기존 보스 E2E가 기능 assertion이 아니라 120초 전체 timeout에 걸렸다. 최초 전체 통과 결과를 취소할 기능 실패 증거는 아니지만, 안정적인 성능 증거로도 사용하지 않는다.

## Production preview 전체 런

preview에서 DEV API 없이 실제 키보드 입력으로 시도했다. 현재 입력 harness에서는 초기 적 링을 안정적으로 이탈하지 못해 00:09~00:16에 패배했고, 08:00 전체 런 증거는 아직 확보하지 못했다. 따라서 이 문서는 HG-02 통과 선언이 아니다.

사람 검증 시 확인할 항목:

- 타이틀 → 브리핑 → 플레이 → 레벨업 → 보스 → 감사 → 승리
- 첫 해킹·여섯 번째 해킹과 현장 파견 수치
- 00:48/02:24/04:24/06:48 통신의 줄바꿈·겹침
- 패배 재시도와 완료 후 기록 보관소
- 8분 전체 런 및 콘솔 오류 0

## 캐릭터 시트·도트 반영 검증

- 해주·나리·이도의 통신 초상화와 직책 표시 확인
- 같은 외형을 기준으로 세 인물 도트 스프라이트 추가
- 이도 도트를 실제 플레이어 스프라이트로 교체
- 좁은 브라우저에서 제목·대사·초상화 배치 확인
- `npm run check`: lint, Node 테스트 27/27, build 통과
- 최신 Playwright: 4개 중 3개 통과. 기존 보스 시나리오는 기능 assertion이 아니라 headless WebGL 지연에 따른 120초 전체 timeout
