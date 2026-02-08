const canvas = document.querySelector("#sim-canvas");
const ctx = canvas.getContext("2d");
const spawnButton = document.querySelector("#spawn-track");

const FIXED_TIMESTEP_MS = 100;
const tracks = [];

let lastFrameMs = performance.now();
let accumulatorMs = 0;
let tick = 0;

const palette = ["#4dd1ff", "#9bff73", "#ffbf4d", "#ff5f8a"];

function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function spawnTrack() {
  const id = `track-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const heading = randomBetween(0, Math.PI * 2);
  const speed = randomBetween(20, 80);

  tracks.push({
    id,
    x: randomBetween(80, canvas.clientWidth - 80),
    y: randomBetween(80, canvas.clientHeight - 80),
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    color: palette[tracks.length % palette.length],
    history: [],
  });
}

function step(dtSeconds) {
  tick += 1;

  tracks.forEach((track) => {
    // # sim: move track according to its velocity
    track.x += track.vx * dtSeconds;
    track.y += track.vy * dtSeconds;

    // # sim: bounce off edges for now (placeholder for sector exits)
    if (track.x < 20 || track.x > canvas.clientWidth - 20) {
      track.vx *= -1;
      track.x = Math.max(20, Math.min(canvas.clientWidth - 20, track.x));
    }

    if (track.y < 20 || track.y > canvas.clientHeight - 20) {
      track.vy *= -1;
      track.y = Math.max(20, Math.min(canvas.clientHeight - 20, track.y));
    }

    track.history.push({ x: track.x, y: track.y });
    if (track.history.length > 20) {
      track.history.shift();
    }
  });
}

function drawDiamond(x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.stroke();
}

function draw(alpha) {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  ctx.fillStyle = "rgba(11, 17, 24, 0.8)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.setLineDash([4, 6]);
  for (let i = 1; i < 8; i += 1) {
    const x = (canvas.clientWidth / 8) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.clientHeight);
    ctx.stroke();
  }
  for (let j = 1; j < 5; j += 1) {
    const y = (canvas.clientHeight / 5) * j;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.clientWidth, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  tracks.forEach((track) => {
    const predictedX = track.x + track.vx * (alpha * FIXED_TIMESTEP_MS) * 0.001;
    const predictedY = track.y + track.vy * (alpha * FIXED_TIMESTEP_MS) * 0.001;

    ctx.strokeStyle = track.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    track.history.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    drawDiamond(predictedX, predictedY, 6, track.color);
  });

  ctx.fillStyle = "#9da7b3";
  ctx.font = "12px system-ui";
  ctx.fillText(`Tracks: ${tracks.length}`, 16, 20);
  ctx.fillText(`Ticks: ${tick}`, 16, 36);
}

function frame(now) {
  const elapsedMs = now - lastFrameMs;
  lastFrameMs = now;
  accumulatorMs += elapsedMs;

  while (accumulatorMs >= FIXED_TIMESTEP_MS) {
    step(FIXED_TIMESTEP_MS / 1000);
    accumulatorMs -= FIXED_TIMESTEP_MS;
  }

  draw(accumulatorMs / FIXED_TIMESTEP_MS);
  requestAnimationFrame(frame);
}

spawnButton.addEventListener("click", spawnTrack);
window.addEventListener("keydown", (event) => {
  if (event.key === ";") {
    spawnTrack();
  }
});
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
requestAnimationFrame(frame);
