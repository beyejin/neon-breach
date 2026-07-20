// 키보드 입력
const keys = new Set();
const pressed = new Set(); // 이번 프레임에 눌린 키

window.addEventListener('keydown', (e) => {
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

export function axis() {
  let x = 0, y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y -= 1;
  const len = Math.hypot(x, y);
  const running = keys.has('ShiftLeft') || keys.has('ShiftRight');
  return len > 0
    ? { x: x / len, y: y / len, running }
    : { x: 0, y: 0, running: false };
}

export function wasPressed(code) {
  return pressed.has(code);
}

export function consumePressed(code) {
  if (!pressed.has(code)) return false;
  pressed.delete(code);
  return true;
}

// 매 프레임 끝에 호출
export function flushInput() {
  pressed.clear();
}
