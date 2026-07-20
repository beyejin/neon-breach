/* global document, window */
import { test, expect } from '@playwright/test';

async function enterPlaying(page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'CHAPTER 1 시작', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'CHAPTER 1 시작', exact: true }).click();
  await expect(page.getByRole('button', { name: '작전 시작', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '작전 시작', exact: true }).click();
  await page.waitForFunction(() => window.__game?.snapshot().appMode === 'playing');
}

async function snapshot(page) {
  return page.evaluate(() => window.__game.snapshot());
}

test.describe('CH1 브라우저 회귀', () => {
  test('타이틀에서 네온사인과 스토리형 괴담 처리 테마를 선택한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button[data-theme="neon"]')).toBeVisible();
    await page.locator('button[data-theme="casefile"]').click();
    await expect(page.locator('button[data-theme="casefile"]')).toHaveClass(/selected/);
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('casefile');

    await page.getByRole('button', { name: 'CHAPTER 1 시작', exact: true }).click();
    const portraits = await page.locator('.story-blocking .story-portrait').evaluateAll((nodes) => (
      nodes.map((node) => node.style.backgroundImage)
    ));
    expect(portraits).toHaveLength(3);
    expect(portraits.every((value) => value.includes('ch1-portraits-casefile'))).toBe(true);
  });

  test('타이틀에서 브리핑을 거쳐 실제 전투에 진입한다', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/');
    await expect(page.locator('#hud')).toBeHidden();
    await page.getByRole('button', { name: 'CHAPTER 1 시작', exact: true }).click();
    await expect(page.locator('#hud')).toBeHidden();
    await expect(page.locator('.story-blocking .story-portrait')).toHaveCount(3);
    await expect(page.locator('.story-pixel-avatar')).toHaveCount(0);
    await page.getByRole('button', { name: '작전 시작', exact: true }).click();
    await page.waitForFunction(() => window.__game?.snapshot().appMode === 'playing');
    await expect(page.locator('#hud')).toBeVisible();
    await expect(page.getByText(/차단 0/)).toBeVisible();
    expect(errors).toEqual([]);
    expect((await snapshot(page)).runState).toMatchObject({
      chapterId: 'ch1',
      elapsed: expect.any(Number),
      level: 1,
    });
  });

  test('시간 이벤트가 경계에서 한 번씩 큐에 들어간다', async ({ page }) => {
    await enterPlaying(page);
    const boundaries = [
      ['ch1.time.0048', 47.9],
      ['ch1.time.0144', 143.9],
      ['ch1.time.0264', 263.9],
      ['ch1.time.0408', 407.9],
    ];

    for (const [eventId, elapsed] of boundaries) {
      const state = await page.evaluate((value) => {
        window.__game.setElapsed(value);
        window.__game.setPlayerHp(100);
        window.__game.step(0.2);
        return window.__game.snapshot();
      }, elapsed);
      expect(state.runState.firedStoryEventIds).toContain(eventId);
    }

    const state = await snapshot(page);
    const ids = state.runState.firedStoryEventIds;
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(boundaries.map(([id]) => id)));
  });

  test('보스 정책 노드가 감사 카드 뒤에 승리로 이어진다', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await enterPlaying(page);

    await page.evaluate(() => window.__game.setElapsed(479.9));
    await page.evaluate(() => window.__game.setPlayerHp(100));
    await page.evaluate(() => window.__game.step(0.2));
    await page.waitForFunction(() => window.__game.snapshot().boss.active);
    await page.evaluate(() => window.__game.setBossHpRatio(0.5));
    await page.evaluate(() => window.__game.step(0.1));
    await page.waitForFunction(() => window.__game.snapshot().policyNode.active);
    expect((await snapshot(page)).boss.policyLocked).toBe(true);
    await expect.poll(() => page.evaluate(() => {
      window.__game.setPlayerHp(100);
      return window.__game.snapshot().storyBusy;
    })).toBe(false);
    await page.evaluate(() => {
      const { x, y } = window.__game.snapshot().policyNode;
      window.__game.setPlayerPosition(x, y);
      window.__game.step(0.1);
    });
    await expect.poll(() => page.evaluate(() => {
      window.__game.setPlayerHp(100);
      return window.__game.snapshot().hackTargetKind;
    })).toBe('policy-node');
    await page.keyboard.down('Space');
    await page.evaluate(() => window.__game.step(0.1));
    await page.keyboard.up('Space');
    await expect(page.locator('.story-audit')).toBeVisible();

    await page.waitForTimeout(4_100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(4_100);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__game.snapshot().boss.policyResolved);
    expect((await snapshot(page)).appMode).toBe('playing');

    await page.evaluate(() => window.__game.setPlayerHp(100));
    await page.evaluate(() => window.__game.setBossHpRatio(0));
    await page.evaluate(() => window.__game.step(0.1));
    await page.waitForFunction(() => window.__game.snapshot().appMode === 'victory');
    await expect(page.getByText('CHAPTER 1 COMPLETE')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('패배 후 페이지 새로고침 없이 다시 시도한다', async ({ page }) => {
    await enterPlaying(page);
    await page.evaluate(() => window.__game.setPlayerHp(0));
    await page.evaluate(() => window.__game.step(0.1));
    await page.waitForFunction(() => window.__game.snapshot().appMode === 'defeat');
    await expect(page.getByRole('button', { name: '다시 시도', exact: true })).toBeVisible();

    await page.getByRole('button', { name: '다시 시도', exact: true }).click();
    await expect(page.getByText('다시 연결됐어. 보스가 오기까지 8분 남았어.')).toBeVisible();
    await page.getByRole('button', { name: '작전 시작', exact: true }).click();
    await page.waitForFunction(() => window.__game.snapshot().appMode === 'playing');
    const retried = await snapshot(page);
    expect(retried.runState.elapsed).toBeLessThan(1);
    expect(retried.runState).toMatchObject({
      blocks: 0,
      bossSpawned: false,
      hackSuccessCount: 0,
    });
  });
});
