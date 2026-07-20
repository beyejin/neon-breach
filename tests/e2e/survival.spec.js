/* global window */
import { test, expect } from '@playwright/test';

test('1분 극한 생존 스테이지는 60초를 버티면 승리한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '1분 극한 생존', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '1분 극한 생존', exact: true }).click();
  await expect(page.getByText('목표 생존 시간 01:00')).toBeVisible();
  await page.getByRole('button', { name: '작전 시작', exact: true }).click();
  await page.waitForFunction(() => window.__game?.snapshot().appMode === 'playing');

  await page.evaluate(() => {
    window.__game.setElapsed(59.9);
    window.__game.setPlayerHp(100);
    window.__game.step(0.2);
  });
  await page.waitForFunction(() => window.__game.snapshot().appMode === 'victory');

  expect((await page.evaluate(() => window.__game.snapshot())).runState.chapterId)
    .toBe('survival-1m');
  await expect(page.getByText('SURVIVAL COMPLETE')).toBeVisible();
});
