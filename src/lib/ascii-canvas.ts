import type { Env, Piece } from "ascii.rest";

/**
 * Draws a scene's characters directly at the canvas's display resolution.
 * Pauses offscreen, in hidden tabs, and for reduced motion. Returns cleanup
 * for all animation frames, observers, and event listeners it owns.
 */
export const mountAsciiCanvas = (
  canvas: HTMLCanvasElement,
  piece: Piece,
): (() => void) => {
  const context = canvas.getContext("2d");
  if (!context) return () => {};

  const { cols, rows, palette, cell = 2, still = 0 } = piece.meta;
  const frame = piece.default();
  const colors = palette ? new Uint8Array(cols * rows) : undefined;
  const environment: Env = { paper: false };
  if (colors) environment.color = colors;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let time = motion.matches ? still : 0;
  let visible = false;
  let animation = 0;
  let last = 0;
  const fps = Math.min(piece.meta.fps, 12);

  const draw = () => {
    const style = getComputedStyle(canvas);
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width / cols;
    const height = canvas.height / rows;
    context.font = `${width / 0.6}px ${style.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const text = frame(time, environment);
    let x = 0;
    let y = 0;
    for (const character of text) {
      if (character === "\n") {
        x = 0;
        y++;
        continue;
      }
      if (character !== " ") {
        const index = colors?.[y * cols + x];
        context.fillStyle =
          index === undefined ? style.color : (palette?.[index] ?? style.color);
        context.fillText(character, (x + 0.5) * width, (y + 0.5) * height);
      }
      x++;
    }
  };

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(
      1,
      Math.round((canvas.clientWidth * rows * cell * ratio) / cols),
    );
    draw();
  };
  canvas.style.aspectRatio = `${cols} / ${rows * cell}`;
  resize();

  const tick = (now: number) => {
    animation = requestAnimationFrame(tick);
    const elapsed = now - last;
    if (elapsed < 1000 / fps) return;
    last = now;
    time += Math.min(elapsed, 100) / 1000;
    draw();
  };

  const run = () => {
    const playing = fps > 0 && visible && !document.hidden && !motion.matches;
    if (playing && !animation) {
      last = performance.now();
      animation = requestAnimationFrame(tick);
    } else if (!playing && animation) {
      cancelAnimationFrame(animation);
      animation = 0;
    }
  };

  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver((entries) => {
    const entry = entries.at(-1);
    if (!entry) return;
    visible = entry.isIntersecting;
    run();
  });
  visibilityObserver.observe(canvas);
  document.addEventListener("visibilitychange", run);
  motion.addEventListener("change", run);

  return () => {
    cancelAnimationFrame(animation);
    sizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener("visibilitychange", run);
    motion.removeEventListener("change", run);
  };
};
