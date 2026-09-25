import { fragmentShader, VERTEX_SHADER } from "./shader";

export type BlackHoleFraming = "center" | "hero";
export type BlackHoleQuality = "auto" | "low" | "high";

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  /** "center": hole in the middle. "hero": hole to the right on wide screens, raised on tall screens. */
  framing?: BlackHoleFraming;
  /** "auto" picks "low" on small or low-core devices. */
  quality?: BlackHoleQuality;
  /** Disk tint (linear RGB, 0–1). Defaults to a warm white. */
  tint?: [number, number, number];
  /** Draw a single frame and stop. Defaults to `prefers-reduced-motion: reduce`. */
  staticFrame?: boolean;
  /** Frame-rate cap for the animated disk. */
  maxFps?: number;
}

export interface BlackHoleRenderer {
  /** Resolves `true` after the first frame is on screen, `false` if WebGL is unavailable. */
  ready: Promise<boolean>;
  dispose(): void;
}

interface QualityPreset {
  steps: number;
  /** Render-buffer pixels per CSS pixel (before the adaptive factor). */
  scale: number;
}

const PRESETS: Record<"low" | "high", QualityPreset> = {
  low: { steps: 90, scale: 0.5 },
  high: { steps: 150, scale: 0.75 },
};

type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const scale3 = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

interface Camera {
  position: Vec3;
  right: Vec3;
  up: Vec3;
  forward: Vec3;
  focus: [number, number];
  focal: number;
}

/** Camera slightly above the disk plane, rolled so the disk sweeps up to the right. */
function computeCamera(framing: BlackHoleFraming, aspect: number): Camera {
  const distance = 26;
  const elevation = (7 * Math.PI) / 180;
  const azimuth = (-18 * Math.PI) / 180;
  const roll = (-11 * Math.PI) / 180;

  const position: Vec3 = [
    distance * Math.cos(elevation) * Math.sin(azimuth),
    distance * Math.sin(elevation),
    distance * Math.cos(elevation) * Math.cos(azimuth),
  ];
  const forward = normalize(sub([0, 0, 0], position));
  const right0 = normalize(cross(forward, [0, 1, 0]));
  const up0 = cross(right0, forward);
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const right = add(scale3(right0, c), scale3(up0, s));
  const up = add(scale3(up0, c), scale3(right0, -s));

  let focus: [number, number] = [0, 0];
  let focal = 1.9;
  if (framing === "hero") {
    if (aspect >= 1.05) {
      focus = [(0.71 - 0.5) * aspect, 0.06];
      focal = 2.35;
    } else {
      focus = [0, 0.16];
      focal = Math.max(0.9, 1.9 * aspect);
    }
  } else if (aspect < 1) {
    focal = Math.max(0.9, 1.9 * aspect);
  }
  return { position, right, up, forward, focus, focal };
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[black-hole] shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Creates a WebGL black-hole renderer bound to `canvas`.
 *
 * Performance measures:
 *  - renders below native resolution and lets CSS upscale (the image is soft by nature)
 *  - fewer ray-march steps and pixels on small / low-core devices
 *  - adaptive resolution: drops the render scale if frames take too long
 *  - frame-rate cap, pauses when off-screen or when the tab is hidden
 *  - a single static frame under prefers-reduced-motion
 */
export function createRenderer(options: RendererOptions): BlackHoleRenderer {
  const { canvas } = options;
  const framing = options.framing ?? "center";
  const tint = options.tint ?? [1.0, 0.9, 0.78];
  const maxFps = options.maxFps ?? 30;

  let resolveReady: (ok: boolean) => void = () => undefined;
  const ready = new Promise<boolean>((resolve) => {
    resolveReady = resolve;
  });

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) {
    resolveReady(false);
    return { ready, dispose: () => undefined };
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticFrame = options.staticFrame ?? reduceMotion;
  const constrained = window.matchMedia("(max-width: 768px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
  const quality = options.quality && options.quality !== "auto" ? options.quality : constrained ? "low" : "high";
  const preset = PRESETS[quality];

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader(preset.steps));
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    resolveReady(false);
    return { ready, dispose: () => undefined };
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[black-hole] program link failed:", gl.getProgramInfoLog(program));
    resolveReady(false);
    return { ready, dispose: () => undefined };
  }
  gl.useProgram(program);

  // One oversized triangle covering the viewport.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const u = {
    resolution: gl.getUniformLocation(program, "uResolution"),
    time: gl.getUniformLocation(program, "uTime"),
    focus: gl.getUniformLocation(program, "uFocus"),
    focal: gl.getUniformLocation(program, "uFocal"),
    camPos: gl.getUniformLocation(program, "uCamPos"),
    camRight: gl.getUniformLocation(program, "uCamRight"),
    camUp: gl.getUniformLocation(program, "uCamUp"),
    camForward: gl.getUniformLocation(program, "uCamForward"),
    tint: gl.getUniformLocation(program, "uTint"),
    exposure: gl.getUniformLocation(program, "uExposure"),
  };
  gl.uniform3f(u.tint, tint[0], tint[1], tint[2]);
  gl.uniform1f(u.exposure, 1.7);

  let adaptive = 1;
  let disposed = false;
  let running = false;
  let visible = true;
  let frameHandle = 0;
  let lastDraw = 0;
  let firstFrameDone = false;
  const startTime = performance.now();
  // Random start angle so the disk doesn't look identical on every load.
  const timeOffset = Math.random() * 140;
  const frameTimes: number[] = [];

  const resize = () => {
    const pixelScale = Math.min(window.devicePixelRatio || 1, 2) * preset.scale * adaptive;
    const width = Math.max(1, Math.round(canvas.clientWidth * pixelScale));
    const height = Math.max(1, Math.round(canvas.clientHeight * pixelScale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.uniform2f(u.resolution, width, height);
    const cam = computeCamera(framing, canvas.clientWidth / Math.max(1, canvas.clientHeight));
    gl.uniform3fv(u.camPos, cam.position);
    gl.uniform3fv(u.camRight, cam.right);
    gl.uniform3fv(u.camUp, cam.up);
    gl.uniform3fv(u.camForward, cam.forward);
    gl.uniform2f(u.focus, cam.focus[0], cam.focus[1]);
    gl.uniform1f(u.focal, cam.focal);
  };

  const draw = (now: number) => {
    const t = staticFrame ? timeOffset : timeOffset + (now - startTime) / 1000;
    gl.uniform1f(u.time, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!firstFrameDone) {
      firstFrameDone = true;
      requestAnimationFrame(() => {
        if (!disposed) resolveReady(true);
      });
    }
  };

  const loop = (now: number) => {
    if (!running) return;
    frameHandle = requestAnimationFrame(loop);
    const elapsed = now - lastDraw;
    if (elapsed < 1000 / maxFps - 2) return;

    // Adaptive resolution: if we can't hold ~20fps, render fewer pixels.
    if (lastDraw > 0) {
      frameTimes.push(elapsed);
      if (frameTimes.length >= 20) {
        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        frameTimes.length = 0;
        if (avg > 55 && adaptive > 0.45) {
          adaptive = Math.max(0.45, adaptive * 0.8);
          resize();
        }
      }
    }
    lastDraw = now;
    draw(now);
  };

  const start = () => {
    if (staticFrame || running || disposed || !visible || document.hidden) return;
    running = true;
    lastDraw = 0;
    frameHandle = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frameHandle);
  };

  resize();
  draw(performance.now());
  start();

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!running) draw(performance.now());
  });
  resizeObserver.observe(canvas);

  const intersection = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    if (visible) start();
    else stop();
  });
  intersection.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    stop();
    resolveReady(false);
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  return {
    ready,
    dispose() {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      resolveReady(false);
    },
  };
}
