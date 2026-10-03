const canvas = document.querySelector("#gcx-rally-canvas");
const ctx = canvas?.getContext("2d");
const arcadeStage = document.querySelector(".arcade-stage");
const startButton = document.querySelector("#arcade-start");
const overlay = document.querySelector("#arcade-overlay");
const scoreEl = document.querySelector("#arcade-score");
const levelEl = document.querySelector("#arcade-level");
const hitsEl = document.querySelector("#arcade-hits");
const timeEl = document.querySelector("#arcade-time");
const bestEl = document.querySelector("#arcade-best");
const countdownEl = document.querySelector("#arcade-countdown");
const dayEl = document.querySelector("#arcade-day");
const leaderboardEl = document.querySelector("#arcade-leaderboard");
const submitForm = document.querySelector("#arcade-submit-form");
const submitButton = document.querySelector("#arcade-submit");
const statusEl = document.querySelector("#arcade-status");
const playerNameInput = document.querySelector("#arcade-player-name");
const soundToggle = document.querySelector("#arcade-sound-toggle");
const maximizeToggle = document.querySelector("#arcade-maximize-toggle");

const storageKey = "gcx-rally-player-v1";
const bestStorageKey = "gcx-rally-best-v1";
const soundMutedStorageKey = "gcx-rally-muted-v1";
let challenge = null;
let leaderboard = [];
let animationId = 0;
let keys = new Set();
let pointerX = null;
let inputMode = "pointer";
let game = null;
let audio = null;
const movementKeys = ["ArrowLeft", "ArrowRight", "a", "A", "d", "D"];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function playerKey() {
  let key = localStorage.getItem(storageKey);
  if (!key) {
    key = `gcx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(storageKey, key);
  }
  return key;
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (const char of String(seedText || "gcx")) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rallyIntensity() {
  if (!game) return 0;
  const levelHeat = Math.max(0, (game.level || 1) - 1) / 18;
  const hitHeat = (game.hits || 0) / 90;
  const rallyHeat = (game.rally || 0) / 130;
  return clamp(levelHeat + hitHeat + rallyHeat, 0, 1);
}

function beatIntervalForIntensity(intensity = rallyIntensity()) {
  return clamp(0.64 - intensity * 0.34, 0.28, 0.64);
}

function initAudio() {
  if (audio || !window.AudioContext && !window.webkitAudioContext) return audio;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  const context = new AudioCtor();
  const master = context.createGain();
  master.gain.value = 0.16;
  master.connect(context.destination);

  const music = context.createGain();
  music.gain.value = 0.06;
  music.connect(master);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  filter.connect(music);

  const padA = context.createOscillator();
  const padB = context.createOscillator();
  const bass = context.createOscillator();
  padA.type = "sine";
  padB.type = "triangle";
  bass.type = "sawtooth";
  padA.frequency.value = 146.83;
  padB.frequency.value = 220;
  bass.frequency.value = 73.42;
  const padGain = context.createGain();
  const bassGain = context.createGain();
  padGain.gain.value = 0.032;
  bassGain.gain.value = 0.012;
  padA.connect(padGain);
  padB.connect(padGain);
  bass.connect(bassGain);
  padGain.connect(filter);
  bassGain.connect(filter);
  padA.start();
  padB.start();
  bass.start();

  audio = {
    context,
    master,
    music,
    filter,
    padA,
    padB,
    bass,
    bassGain,
    muted: localStorage.getItem(soundMutedStorageKey) === "true",
    step: 0,
    timer: 0,
  };
  master.gain.value = audio.muted ? 0 : 0.16;

  scheduleMusicPulse();
  return audio;
}

function playTone(frequency, duration = 0.12, options = {}) {
  const system = initAudio();
  if (!system || system.muted) return;
  const now = system.context.currentTime;
  const osc = system.context.createOscillator();
  const gain = system.context.createGain();
  osc.type = options.type || "sine";
  osc.frequency.setValueAtTime(frequency, now);
  if (options.slideTo) osc.frequency.exponentialRampToValueAtTime(options.slideTo, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(options.gain || 0.08, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(system.master);
  osc.start(now);
  osc.stop(now + duration + 0.03);
}

function playKick(intensity = rallyIntensity()) {
  const system = initAudio();
  if (!system || system.muted) return;
  const now = system.context.currentTime;
  const osc = system.context.createOscillator();
  const gain = system.context.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(86 + intensity * 24, now);
  osc.frequency.exponentialRampToValueAtTime(38 + intensity * 8, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16 + intensity * 0.1, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  osc.connect(gain);
  gain.connect(system.master);
  osc.start(now);
  osc.stop(now + 0.32);
}

function playDrumTick(intensity = rallyIntensity()) {
  const system = initAudio();
  if (!system || system.muted) return;
  const now = system.context.currentTime;
  const bufferSize = Math.max(1, Math.floor(system.context.sampleRate * 0.08));
  const buffer = system.context.createBuffer(1, bufferSize, system.context.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = system.context.createBufferSource();
  const filter = system.context.createBiquadFilter();
  const gain = system.context.createGain();
  noise.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 1200 + intensity * 1800;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.026 + intensity * 0.038, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(system.master);
  noise.start(now);
  noise.stop(now + 0.09);
}

function scheduleMusicPulse() {
  if (!audio) return;
  window.clearTimeout(audio.timer);
  const intensity = rallyIntensity();
  const notes =
    intensity > 0.66
      ? [220, 293.66, 329.63, 440, 493.88, 587.33]
      : intensity > 0.32
        ? [146.83, 196, 220, 293.66, 329.63]
        : [110, 146.83, 164.81, 220, 246.94];
  const note = notes[audio.step % notes.length];
  const bassNote = intensity > 0.66 ? 110 : intensity > 0.32 ? 98 : 73.42;
  audio.step += 1;
  audio.music.gain.setTargetAtTime(0.06 + intensity * 0.05, audio.context.currentTime, 0.12);
  audio.filter.frequency.setTargetAtTime(760 + intensity * 3900, audio.context.currentTime, 0.08);
  audio.padA.frequency.setTargetAtTime(note / 2, audio.context.currentTime, 0.12);
  audio.padB.frequency.setTargetAtTime(note * (intensity > 0.62 ? 1.5 : 1), audio.context.currentTime, 0.12);
  audio.bass.frequency.setTargetAtTime(bassNote, audio.context.currentTime, 0.18);
  audio.bassGain.gain.setTargetAtTime(0.02 + intensity * 0.06, audio.context.currentTime, 0.12);
  if (!audio.muted && game?.running) {
    playKick(intensity);
    if (audio.step % 2 === 0 || intensity > 0.52) playDrumTick(intensity);
    playTone(note * (intensity > 0.66 ? 3 : 2), 0.18, {
      type: intensity > 0.62 ? "triangle" : "sine",
      gain: 0.016 + intensity * 0.04,
    });
    if (intensity > 0.5 && audio.step % 3 === 0) {
      playTone(note * 2, 0.24, { type: "sawtooth", gain: 0.018 + intensity * 0.025 });
    }
  }
  audio.timer = window.setTimeout(scheduleMusicPulse, beatIntervalForIntensity(intensity) * 1000);
}

function resumeAudio() {
  const system = initAudio();
  if (!system) return;
  if (system.context.state === "suspended") system.context.resume();
  scheduleMusicPulse();
}

function updateSoundToggle() {
  if (!soundToggle) return;
  const muted = audio?.muted || localStorage.getItem(soundMutedStorageKey) === "true";
  soundToggle.textContent = muted ? "Sound: Off" : "Sound: On";
  soundToggle.classList.toggle("is-muted", muted);
  soundToggle.setAttribute("aria-pressed", muted ? "true" : "false");
}

function setArcadeMaximized(isMaximized) {
  document.body.classList.toggle("is-arcade-maximized", isMaximized);
  if (maximizeToggle) {
    maximizeToggle.textContent = isMaximized ? "Restore" : "Maximize";
    maximizeToggle.setAttribute("aria-pressed", isMaximized ? "true" : "false");
  }
}

async function toggleArcadeMaximized() {
  const isFullscreen = document.fullscreenElement === arcadeStage;
  try {
    if (isFullscreen) {
      await document.exitFullscreen();
      return;
    }
    if (arcadeStage?.requestFullscreen) {
      await arcadeStage.requestFullscreen();
      return;
    }
  } catch (error) {
    // Fall back to page takeover mode when browser fullscreen is blocked.
  }
  setArcadeMaximized(!document.body.classList.contains("is-arcade-maximized"));
}

function updateCountdown() {
  if (!challenge || !countdownEl) return;
  const remaining = new Date(challenge.cutoffAt).getTime() - Date.now();
  if (remaining <= 0) {
    countdownEl.textContent = "Closed";
    return;
  }
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  countdownEl.textContent = `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function renderLeaderboard() {
  if (!leaderboardEl) return;
  const rows = Array.from({ length: 5 }, (_, index) => leaderboard[index] || { rank: index + 1, playerName: "Open slot", score: 0, empty: true });
  leaderboardEl.innerHTML = rows
    .map(
      (row) => `
        <li${row.empty ? ' class="is-empty"' : ""}>
          <span>${row.rank}</span>
          <strong>${escapeHtml(row.playerName)}</strong>
          <em>${row.empty ? "-" : `${Number(row.score || 0).toLocaleString()} / L${Number(row.level || 1).toLocaleString()}`}</em>
        </li>
      `
    )
    .join("");
}

async function loadDailyChallenge() {
  const response = await fetch("/api/arcade/daily");
  if (!response.ok) throw new Error("Daily challenge could not be loaded.");
  const payload = await response.json();
  challenge = payload.data.challenge;
  leaderboard = payload.data.leaderboard || [];
  if (dayEl) dayEl.textContent = `${challenge.mode} - ${challenge.dayId} - closes ${challenge.cutoffLabel}`;
  renderLeaderboard();
  updateCountdown();
}

function levelDifficulty(level) {
  const safeLevel = Math.max(1, Math.round(level || 1));
  if (safeLevel === 1) {
    return {
      level: 1,
      tier: 0,
      targetCount: 32,
      obstacleCount: 0,
      speed: Math.hypot(200, 300),
      paddleWidth: 144,
      paddleMaxSpeed: 760,
      bonusChance: 0.22,
      minGap: 12,
    };
  }
  const tier = Math.floor((safeLevel - 1) / 5);
  return {
    level: safeLevel,
    tier,
    targetCount: clamp(22 + Math.floor(safeLevel * 2) + tier * 2, 26, 72),
    obstacleCount: clamp(Math.floor((safeLevel - 8) / 3) + Math.floor(tier * 0.6), 0, 16),
    speed: clamp(Math.hypot(200, 300) + (safeLevel - 1) * 8 + tier * 12, Math.hypot(200, 300), 940),
    paddleWidth: clamp(154 - tier * 3 - Math.floor((safeLevel - 1) / 12) * 3, 102, 154),
    paddleMaxSpeed: clamp(760 + tier * 32, 760, 1040),
    bonusChance: clamp(0.16 + tier * 0.018, 0.16, 0.32),
    minGap: clamp(16 - Math.floor(tier / 3), 8, 16),
  };
}

function candidateOverlaps(candidate, objects, gap) {
  return objects.some(
    (item) =>
      candidate.x < item.x + item.w + gap &&
      candidate.x + candidate.w + gap > item.x &&
      candidate.y < item.y + item.h + gap &&
      candidate.y + candidate.h + gap > item.y
  );
}

function createOpeningTargets(seed) {
  const random = seededRandom(seed);
  const targets = [];
  const rows = 4;
  const cols = 8;
  const gap = 12;
  const width = 78;
  const height = 24;
  const startX = (canvas.width - cols * width - (cols - 1) * gap) / 2;
  const startY = 74;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const bonus = random() > 0.78;
      targets.push({
        kind: "target",
        x: startX + col * (width + gap),
        y: startY + row * (height + gap),
        w: width,
        h: height,
        value: bonus ? 275 : 125 + row * 35,
        bonus,
        alive: true,
      });
    }
  }
  return targets;
}

function generateLevelObjects(seed, level) {
  const config = levelDifficulty(level);
  if (config.level === 1) return assignLevelPowerUps(createOpeningTargets(seed), config.level, seed);
  const random = seededRandom(`${seed || "gcx-rally"}:level:${config.level}`);
  const objects = [];
  const shapes = [
    { w: 70, h: 22, weight: 0.44 },
    { w: 92, h: 20, weight: 0.22 },
    { w: 52, h: 28, weight: 0.18 },
    { w: 42, h: 42, weight: 0.1 },
    { w: 116, h: 18, weight: 0.06 },
  ];
  const playLeft = 38;
  const playRight = canvas.width - 38;
  const playTop = 68;
  const playBottom = Math.min(config.level <= 4 ? 292 : 350, canvas.height - 158);

  const pickShape = () => {
    const roll = random();
    let total = 0;
    for (const shape of shapes) {
      total += shape.weight;
      if (roll <= total) return shape;
    }
    return shapes[0];
  };

  const place = (kind, index) => {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const shape = kind === "obstacle" ? shapes[3 + Math.floor(random() * 2)] || shapes[3] : pickShape();
      const laneBias = index / Math.max(1, config.targetCount + config.obstacleCount);
      const wave = Math.sin((config.level * 0.73 + index * 1.17) * Math.PI);
      const xRange = playRight - playLeft - shape.w;
      const yRange = playBottom - playTop - shape.h;
      const x = playLeft + clamp((random() * 0.74 + laneBias * 0.26) * xRange + wave * 26, 0, xRange);
      const y = playTop + clamp(random() * yRange, 0, yRange);
      const candidate = {
        kind,
        x,
        y,
        w: shape.w,
        h: shape.h,
        bonus: kind === "target" && random() < config.bonusChance,
        alive: true,
      };
      if (!candidateOverlaps(candidate, objects, config.minGap)) return candidate;
    }
    return null;
  };

  for (let index = 0; index < config.obstacleCount; index += 1) {
    const obstacle = place("obstacle", index);
    if (!obstacle) continue;
    obstacle.value = 0;
    objects.push(obstacle);
  }

  for (let index = 0; index < config.targetCount; index += 1) {
    const target = place("target", index + config.obstacleCount);
    if (!target) continue;
    const depth = (target.y - playTop) / Math.max(1, playBottom - playTop);
    target.value = Math.round((target.bonus ? 340 : 110) + config.level * 18 + depth * 120 + config.tier * 24);
    objects.push(target);
  }

  return assignLevelPowerUps(objects.sort((a, b) => a.y - b.y || a.x - b.x), config.level, seed);
}

function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function assignLevelPowerUps(targets, level, seed) {
  const breakables = targets.filter((target) => target.kind !== "obstacle");
  if (!breakables.length) return targets;
  const random = seededRandom(`${seed || "gcx-rally"}:powerups:${level}`);
  const pick = () => breakables[Math.floor(random() * breakables.length)];
  const rocketTarget = pick();
  if (rocketTarget) rocketTarget.powerUp = "rocket";
  if (level >= 2) {
    const laserTarget = pick();
    if (laserTarget && laserTarget !== rocketTarget) laserTarget.powerUp = "laser";
  }
  if (level >= 4 && random() > 0.62) {
    const bombTarget = pick();
    if (bombTarget && !bombTarget.powerUp) bombTarget.powerUp = "bomb";
  }
  return targets;
}

function powerUpLabel(type) {
  if (type === "rocket") return "R";
  if (type === "laser") return "L";
  if (type === "bomb") return "B";
  return "?";
}

function powerUpColor(type) {
  if (type === "rocket") return "#f97316";
  if (type === "laser") return "#38bdf8";
  if (type === "bomb") return "#facc15";
  return "#ffffff";
}

function drawTargetTile(target) {
  if (target.kind === "obstacle") {
    ctx.save();
    ctx.shadowColor = "rgba(11, 18, 32, 0.38)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    roundedRectPath(ctx, target.x, target.y, target.w, target.h, 10);
    const obstacleGradient = ctx.createLinearGradient(target.x, target.y, target.x, target.y + target.h);
    obstacleGradient.addColorStop(0, "#9ca3af");
    obstacleGradient.addColorStop(0.52, "#4b5563");
    obstacleGradient.addColorStop(1, "#1f2937");
    ctx.fillStyle = obstacleGradient;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
    roundedRectPath(ctx, target.x + 8, target.y + 5, target.w - 16, Math.max(4, target.h * 0.22), 4);
    ctx.fill();
    ctx.restore();
    return;
  }

  const base = target.bonus ? "#8b5cf6" : "#d93b35";
  const edge = target.bonus ? "#5b21b6" : "#9f2427";
  const shine = target.bonus ? "rgba(245, 235, 255, 0.72)" : "rgba(255, 238, 226, 0.72)";
  const radius = 9;

  ctx.save();
  ctx.shadowColor = target.bonus ? "rgba(139, 92, 246, 0.42)" : "rgba(217, 59, 53, 0.38)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  roundedRectPath(ctx, target.x, target.y, target.w, target.h, radius);
  const bodyGradient = ctx.createLinearGradient(target.x, target.y, target.x, target.y + target.h);
  bodyGradient.addColorStop(0, target.bonus ? "#a78bfa" : "#f05a50");
  bodyGradient.addColorStop(0.48, base);
  bodyGradient.addColorStop(1, edge);
  ctx.fillStyle = bodyGradient;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
  ctx.stroke();

  roundedRectPath(ctx, target.x + 5, target.y + 4, target.w - 10, Math.max(6, target.h * 0.34), 6);
  const glareGradient = ctx.createLinearGradient(target.x, target.y + 3, target.x, target.y + target.h * 0.5);
  glareGradient.addColorStop(0, shine);
  glareGradient.addColorStop(1, "rgba(255, 255, 255, 0.06)");
  ctx.fillStyle = glareGradient;
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.36)";
  roundedRectPath(ctx, target.x + 12, target.y + 7, target.w * 0.32, 3, 2);
  ctx.fill();

  ctx.restore();
}

function drawPowerUp(item) {
  ctx.save();
  const color = powerUpColor(item.type);
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#111217";
  ctx.font = "900 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(powerUpLabel(item.type), item.x, item.y + 0.5);
  ctx.restore();
}

function canvasUnits(cssPx) {
  const width = canvas.getBoundingClientRect().width || canvas.width;
  return cssPx / Math.max(0.35, width / canvas.width);
}

function canvasLooksMobile() {
  return (canvas.getBoundingClientRect().width || canvas.width) < 560;
}

function drawMiniRocket(rocket) {
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.angle + Math.PI / 2);
  ctx.shadowColor = "rgba(249, 115, 22, 0.72)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#f97316";
  roundedRectPath(ctx, -4, -11, 8, 18, 4);
  ctx.fill();
  ctx.fillStyle = "#fff7ed";
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(6, -8);
  ctx.lineTo(-6, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(250, 204, 21, 0.82)";
  ctx.beginPath();
  ctx.moveTo(0, 13);
  ctx.lineTo(4, 23);
  ctx.lineTo(-4, 23);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawExplosion(effect) {
  const progress = clamp(effect.age / effect.duration, 0, 1);
  const radius = effect.radius * (0.35 + progress);
  const alpha = 1 - progress;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(250, 204, 21, 0.34)";
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  for (let index = 0; index < 7; index += 1) {
    const angle = effect.seed + index * ((Math.PI * 2) / 7);
    const inner = radius * 0.45;
    const outer = radius * (1.05 + progress * 0.55);
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
    ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function destroyTarget(target, multiplier = 1) {
  if (!target || !target.alive || target.kind === "obstacle") return 0;
  target.alive = false;
  const points = Math.round((target.value || 100) * multiplier);
  game.hits += 1;
  game.score += points;
  if (target.powerUp) {
    game.powerUps.push({
      type: target.powerUp,
      x: target.x + target.w / 2,
      y: target.y + target.h / 2,
      r: target.powerUp === "bomb" ? 10 : 9,
      vy: 128,
    });
    target.powerUp = "";
  }
  return points;
}

function explodeAt(x, y, radius) {
  let destroyed = 0;
  for (const target of game.targets) {
    if (!target.alive || target.kind === "obstacle") continue;
    const centerX = target.x + target.w / 2;
    const centerY = target.y + target.h / 2;
    if (Math.hypot(centerX - x, centerY - y) <= radius) {
      destroyTarget(target, 0.85);
      destroyed += 1;
    }
  }
  if (destroyed) {
    game.rally += destroyed;
    playTone(196 + destroyed * 18, 0.16, { type: "triangle", gain: 0.075, slideTo: 392 + destroyed * 20 });
  }
}

function nearestBreakableTarget(x, y) {
  return game.targets
    .filter((target) => target.alive && target.kind !== "obstacle")
    .map((target) => {
      const centerX = target.x + target.w / 2;
      const centerY = target.y + target.h / 2;
      return {
        target,
        centerX,
        centerY,
        distance: Math.hypot(centerX - x, centerY - y),
      };
    })
    .sort((a, b) => a.distance - b.distance)[0];
}

function rocketImpact(x, y) {
  const nearest = nearestBreakableTarget(x, y);
  if (!nearest) return;
  game.explosions.push({
    x: nearest.centerX,
    y: nearest.centerY,
    radius: 34,
    age: 0,
    duration: 0.58,
    seed: (game.hits + game.level) * 0.7,
  });
  const destroyedTargets = game.targets
    .filter((target) => target.alive && target.kind !== "obstacle")
    .map((target) => {
      const centerX = target.x + target.w / 2;
      const centerY = target.y + target.h / 2;
      return {
        target,
        distance: Math.hypot(centerX - nearest.centerX, centerY - nearest.centerY),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
  destroyedTargets.forEach(({ target }) => destroyTarget(target, 0.9));
  if (destroyedTargets.length) {
    game.rally += destroyedTargets.length;
    playTone(220 + destroyedTargets.length * 44, 0.16, { type: "triangle", gain: 0.075, slideTo: 520 });
  }
}

function updateExplosions(dt) {
  if (!game.explosions?.length) return;
  game.explosions = game.explosions
    .map((effect) => ({ ...effect, age: effect.age + dt }))
    .filter((effect) => effect.age < effect.duration);
}

function spawnRocketSwarm(x, y) {
  const targets = game.targets.filter((target) => target.alive && target.kind !== "obstacle");
  if (!targets.length) return;
  const sortedTargets = targets
    .map((target) => ({
      target,
      centerX: target.x + target.w / 2,
      centerY: target.y + target.h / 2,
      distance: Math.hypot(target.x + target.w / 2 - x, target.y + target.h / 2 - y),
    }))
    .sort((a, b) => a.distance - b.distance);
  const destinations = [sortedTargets[0], sortedTargets[Math.min(sortedTargets.length - 1, Math.max(1, Math.floor(sortedTargets.length * 0.38)))]];
  game.rockets.push(
    ...destinations.map((destination, index) => ({
      x,
      y,
      startX: x,
      startY: y,
      targetX: destination.centerX,
      targetY: destination.centerY,
      age: 0,
      duration: 0.72 + index * 0.12,
      phase: index * Math.PI,
      angle: -Math.PI / 2,
    }))
  );
  playTone(392, 0.1, { type: "sawtooth", gain: 0.055, slideTo: 587.33 });
}

function activatePowerUp(type, x = game.paddle.x + game.paddle.w / 2, y = game.paddle.y) {
  if (type === "rocket") {
    spawnRocketSwarm(x, y);
  } else if (type === "laser") {
    game.laserUntil = performance.now() + 5000;
    playTone(783.99, 0.12, { type: "sine", gain: 0.07 });
  } else if (type === "bomb") {
    let destroyed = 0;
    for (const target of game.targets) {
      if (target.alive && target.kind !== "obstacle") {
        destroyTarget(target, 0.65);
        destroyed += 1;
      }
    }
    game.rally += destroyed;
    playTone(110, 0.32, { type: "sawtooth", gain: 0.095, slideTo: 55 });
  }
}

function updateRockets(dt) {
  if (!game.rockets?.length) return;
  game.rockets = game.rockets.filter((rocket) => {
    rocket.age += dt;
    const progress = clamp(rocket.age / rocket.duration, 0, 1);
    const ease = 1 - Math.pow(1 - progress, 2);
    const swirl = Math.sin(progress * Math.PI * 4 + rocket.phase) * 28 * (1 - progress);
    const nextX = rocket.startX + (rocket.targetX - rocket.startX) * ease + swirl;
    const nextY = rocket.startY + (rocket.targetY - rocket.startY) * ease - Math.sin(progress * Math.PI) * 82;
    rocket.angle = Math.atan2(nextY - rocket.y, nextX - rocket.x);
    rocket.x = nextX;
    rocket.y = nextY;
    if (progress >= 1) {
      rocketImpact(rocket.targetX, rocket.targetY);
      return false;
    }
    return true;
  });
}

function updatePowerUps(dt) {
  if (!game.powerUps?.length) return;
  game.powerUps.forEach((item) => {
    item.y += item.vy * dt;
  });
  game.powerUps = game.powerUps.filter((item) => {
    const caught =
      item.y + item.r >= game.paddle.y &&
      item.y - item.r <= game.paddle.y + game.paddle.h &&
      item.x >= game.paddle.x &&
      item.x <= game.paddle.x + game.paddle.w;
    if (caught) {
      activatePowerUp(item.type, item.x, item.y);
      return false;
    }
    return item.y - item.r <= canvas.height;
  });
}

function updateLasers(dt) {
  if (!game.laserUntil || performance.now() > game.laserUntil) return;
  game.laserTimer = (game.laserTimer || 0) - dt;
  if (game.laserTimer > 0) return;
  game.laserTimer = 0.22;
  const beams = [game.paddle.x + 12, game.paddle.x + game.paddle.w - 12];
  let hit = false;
  for (const beamX of beams) {
    const targets = game.targets
      .filter((target) => target.alive && target.kind !== "obstacle" && beamX >= target.x && beamX <= target.x + target.w)
      .sort((a, b) => b.y - a.y);
    if (targets[0]) {
      destroyTarget(targets[0], 1);
      hit = true;
    }
  }
  if (hit) playTone(987.77, 0.06, { type: "square", gain: 0.045 });
}

function updateBassPulse(dt) {
  if (!game) return;
  game.beatTimer = (game.beatTimer || 0) + dt;
  game.bassPulse = Math.max(0, (game.bassPulse || 0) - dt * 1.65);
  if (!game.running || game.ended) return;
  const intensity = rallyIntensity();
  const interval = beatIntervalForIntensity(intensity);
  if (game.beatTimer >= interval) {
    game.beatTimer %= interval;
    game.bassPulse = 1;
  }
}

function colorCycle(progress, alpha) {
  const hue = Math.round(205 + progress * 185) % 360;
  return `hsla(${hue}, 88%, 58%, ${alpha})`;
}

function drawBassCircle() {
  const intensity = rallyIntensity();
  const pulse = game?.bassPulse || 0;
  const progress = clamp(((game?.level || 1) - 1) / 24 + intensity * 0.45, 0, 1);
  const centerX = canvas.width / 2;
  const centerY = canvas.height * (canvasLooksMobile() ? 0.56 : 0.58);
  const baseRadius = canvas.width * (canvasLooksMobile() ? 0.25 : 0.22);
  const radius = baseRadius * (1 + pulse * 0.16 + intensity * 0.08);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const halo = ctx.createRadialGradient(centerX, centerY, radius * 0.08, centerX, centerY, radius * 1.45);
  halo.addColorStop(0, colorCycle(progress, 0.42 + pulse * 0.22));
  halo.addColorStop(0.38, colorCycle((progress + 0.18) % 1, 0.2 + intensity * 0.16));
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < 5; i += 1) {
    const ringRadius = radius * (0.72 + i * 0.18 + pulse * 0.055);
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = colorCycle((progress + i * 0.11) % 1, 0.17 + pulse * 0.13);
    ctx.lineWidth = canvasUnits(3 + i * 0.7 + pulse * 4);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(6, 7, 12, 0.56)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.24 * (1 + pulse * 0.1), 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = canvasUnits(2);
  ctx.stroke();
  ctx.restore();
}

function drawGameCoverBackground() {
  const intensity = rallyIntensity();
  const progress = clamp(((game?.level || 1) - 1) / 24 + intensity * 0.5, 0, 1);
  const base = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  base.addColorStop(0, `hsl(${220 + progress * 80}, 54%, 10%)`);
  base.addColorStop(0.44, `hsl(${225 + progress * 120}, 52%, ${18 + intensity * 5}%)`);
  base.addColorStop(0.72, `hsl(${285 + progress * 70}, 48%, ${17 + intensity * 6}%)`);
  base.addColorStop(1, `hsl(${335 + progress * 50}, 54%, 9%)`);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.filter = "blur(22px)";
  const forms = [
    { x: 170, y: 170, r: 170, color: "rgba(37, 99, 235, 0.62)" },
    { x: 720, y: 120, r: 150, color: "rgba(217, 59, 53, 0.58)" },
    { x: 520, y: 430, r: 210, color: "rgba(139, 92, 246, 0.5)" },
    { x: 310, y: 390, r: 150, color: "rgba(242, 184, 75, 0.38)" },
  ];
  forms.forEach((form) => {
    const glow = ctx.createRadialGradient(form.x, form.y, 12, form.x, form.y, form.r);
    glow.addColorStop(0, form.color);
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(form.x, form.y, form.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  drawBassCircle();

  ctx.fillStyle = "rgba(6, 7, 12, 0.42)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255,255,255,0.11)";
  ctx.lineWidth = 2;
  for (let x = 60; x < canvas.width; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 80, canvas.height);
    ctx.stroke();
  }
}

function drawPaddle() {
  const paddle = game.paddle;
  ctx.save();
  ctx.shadowColor = "rgba(242, 184, 75, 0.45)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  roundedRectPath(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 11);
  const body = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
  body.addColorStop(0, "#fff0a8");
  body.addColorStop(0.45, "#f2b84b");
  body.addColorStop(1, "#b56b21");
  ctx.fillStyle = body;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.stroke();

  roundedRectPath(ctx, paddle.x + 10, paddle.y + 3, paddle.w - 20, 5, 4);
  const glare = ctx.createLinearGradient(paddle.x, paddle.y + 2, paddle.x, paddle.y + 9);
  glare.addColorStop(0, "rgba(255, 255, 255, 0.66)");
  glare.addColorStop(1, "rgba(255, 255, 255, 0.08)");
  ctx.fillStyle = glare;
  ctx.fill();

  ctx.fillStyle = "rgba(17, 18, 23, 0.18)";
  roundedRectPath(ctx, paddle.x + paddle.w * 0.42, paddle.y + paddle.h - 4, paddle.w * 0.16, 2.5, 2);
  ctx.fill();
  ctx.restore();
}

function prepareLevel(level) {
  const config = levelDifficulty(level);
  const random = seededRandom(`${challenge?.seed || "gcx-rally"}:serve:${level}`);
  const serveAngle = (random() > 0.5 ? 1 : -1) * (0.42 + random() * 0.42);
  const launchVx = level === 1 ? (random() > 0.5 ? 200 : -200) : Math.sin(serveAngle) * config.speed;
  const launchVy = level === 1 ? -300 : -Math.cos(serveAngle) * config.speed;
  game.level = level;
  game.levelStartedAt = performance.now();
  game.levelClearUntil = 0;
  game.waitingForServe = true;
  game.paddle.w = config.paddleWidth;
  game.paddle.maxSpeed = config.paddleMaxSpeed;
  game.paddle.x = canvas.width / 2 - game.paddle.w / 2;
  game.paddle.y = canvas.height - 58;
  game.paddle.vx = 0;
  game.ball.x = canvas.width / 2;
  game.ball.y = canvas.height - 94;
  game.ball.r = clamp(10 - Math.floor(config.tier / 5), 8, 10);
  game.ball.vx = 0;
  game.ball.vy = 0;
  game.ball.pendingVx = launchVx;
  game.ball.pendingVy = launchVy;
  game.ball.speed = config.speed;
  game.targets = generateLevelObjects(challenge?.seed, level);
  game.powerUps = [];
  game.rockets = [];
  game.explosions = [];
  game.laserUntil = 0;
  game.laserTimer = 0;
}

function launchLevel() {
  if (!game?.running || game.ended || !game.waitingForServe) return;
  game.waitingForServe = false;
  game.levelStartedAt = performance.now();
  game.ball.vx = game.ball.pendingVx || 0;
  game.ball.vy = game.ball.pendingVy || -levelDifficulty(game.level).speed;
  playTone(329.63, 0.1, { type: "triangle", gain: 0.04 });
}

function resetGame() {
  resumeAudio();
  game = {
    running: true,
    ended: false,
    submitted: false,
    startedAt: performance.now(),
    endedAt: 0,
    score: 0,
    hits: 0,
    level: 1,
    highestLevel: 1,
    levelStartedAt: performance.now(),
    levelClearUntil: 0,
    waitingForServe: true,
    powerUps: [],
    rockets: [],
    explosions: [],
    laserUntil: 0,
    laserTimer: 0,
    rally: 0,
    beatTimer: 0,
    bassPulse: 0,
    paddle: {
      x: canvas.width / 2 - 72,
      y: canvas.height - 58,
      w: 144,
      h: 16,
      vx: 0,
      maxSpeed: 760,
      acceleration: 4200,
      friction: 9,
    },
    ball: {
      x: canvas.width / 2,
      y: canvas.height - 92,
      r: 10,
      vx: 0,
      vy: 0,
      pendingVx: 0,
      pendingVy: -300,
      speed: 365,
    },
    targets: [],
  };
  prepareLevel(1);
  if (submitButton) submitButton.disabled = true;
  if (statusEl) statusEl.textContent = "";
  overlay?.classList.add("is-hidden");
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(tick);
}

function endGame(message) {
  if (!game || game.ended) return;
  game.running = false;
  game.ended = true;
  game.endedAt = performance.now();
  const best = Math.max(Number(localStorage.getItem(bestStorageKey) || 0), game.score);
  localStorage.setItem(bestStorageKey, String(best));
  if (bestEl) bestEl.textContent = best.toLocaleString();
  if (submitButton) submitButton.disabled = !challenge?.isOpen;
  playTone(110, 0.42, { type: "triangle", gain: 0.09, slideTo: 73.42 });
  if (overlay) {
    const savedName = playerNameInput?.value.trim() || localStorage.getItem("gcx-rally-name-v1") || "";
    overlay.classList.remove("is-hidden");
    overlay.innerHTML = `
      <p class="kicker">Run Complete</p>
      <h2>${escapeHtml(message)}</h2>
      <p>Final score: <strong>${game.score.toLocaleString()}</strong>. You reached <strong>Level ${game.highestLevel || game.level || 1}</strong>. Add your display name for today's Top 5 board.</p>
      <form id="arcade-overlay-submit" class="arcade-overlay-form">
        <label>
          Display name
          <input id="arcade-overlay-player-name" type="text" maxlength="24" placeholder="GCX Player" value="${escapeHtml(savedName)}" />
        </label>
        <div>
          <button class="button" type="submit"${challenge?.isOpen ? "" : " disabled"}>Submit score</button>
          <button id="arcade-restart" class="button secondary" type="button">Play again</button>
        </div>
      </form>
    `;
    const overlayInput = document.querySelector("#arcade-overlay-player-name");
    document.querySelector("#arcade-overlay-submit")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (playerNameInput && overlayInput) playerNameInput.value = overlayInput.value;
      submitForm?.requestSubmit();
    });
    document.querySelector("#arcade-restart")?.addEventListener("click", resetGame);
    overlayInput?.focus();
    overlayInput?.select();
  }
}

function draw() {
  if (!ctx || !game) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGameCoverBackground();

  game.targets.forEach((target) => {
    if (!target.alive) return;
    drawTargetTile(target);
  });
  game.powerUps?.forEach(drawPowerUp);
  game.rockets?.forEach(drawMiniRocket);
  game.explosions?.forEach(drawExplosion);

  drawPaddle();
  if (game.laserUntil && performance.now() < game.laserUntil) {
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.88)";
    ctx.lineWidth = 3;
    [game.paddle.x + 12, game.paddle.x + game.paddle.w - 12].forEach((beamX) => {
      ctx.beginPath();
      ctx.moveTo(beamX, game.paddle.y);
      ctx.lineTo(beamX, 42);
      ctx.stroke();
    });
    ctx.restore();
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(game.ball.x, game.ball.y, game.ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = `800 ${canvasUnits(canvasLooksMobile() ? 11 : 18)}px Inter, sans-serif`;
  ctx.fillText(canvasLooksMobile() ? `Level ${game.level || 1}` : `GCX Rally ${challenge?.dayId || ""} - Level ${game.level || 1}`, canvasUnits(canvasLooksMobile() ? 10 : 28), canvasUnits(canvasLooksMobile() ? 18 : 36));
  if (game.levelClearUntil && performance.now() < game.levelClearUntil) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `900 ${canvasUnits(canvasLooksMobile() ? 22 : 34)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Level ${game.level}`, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }
  if (game.waitingForServe && game.running && !game.ended) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.font = `900 ${canvasUnits(canvasLooksMobile() ? 19 : 28)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Level ${game.level} Ready`, canvas.width / 2, canvas.height / 2 - canvasUnits(canvasLooksMobile() ? 8 : 10));
    ctx.font = `800 ${canvasUnits(canvasLooksMobile() ? 12 : 16)}px Inter, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText(canvasLooksMobile() ? "Tap to launch" : "Press Space or click to launch", canvas.width / 2, canvas.height / 2 + canvasUnits(canvasLooksMobile() ? 18 : 22));
    ctx.restore();
  }
}

function normalizeBallSpeed(targetSpeed) {
  const { ball } = game;
  const currentSpeed = Math.hypot(ball.vx, ball.vy) || targetSpeed;
  const speed = clamp(targetSpeed, 280, 1040);
  ball.vx = (ball.vx / currentSpeed) * speed;
  ball.vy = (ball.vy / currentSpeed) * speed;
  if (Math.abs(ball.vy) < speed * 0.48) {
    ball.vy = (ball.vy < 0 ? -1 : 1) * speed * 0.48;
    const xSpeed = Math.sqrt(Math.max(0, speed * speed - ball.vy * ball.vy));
    ball.vx = (ball.vx < 0 ? -1 : 1) * xSpeed;
  }
}

function reflectBallFromRect(rect) {
  const { ball } = game;
  const previousX = ball.x - ball.vx * (game.lastDt || 0.016);
  const previousY = ball.y - ball.vy * (game.lastDt || 0.016);
  const fromLeft = previousX + ball.r <= rect.x;
  const fromRight = previousX - ball.r >= rect.x + rect.w;
  const fromTop = previousY + ball.r <= rect.y;
  const fromBottom = previousY - ball.r >= rect.y + rect.h;

  if ((fromLeft || fromRight) && !fromTop && !fromBottom) {
    ball.vx *= -1;
    ball.x = fromLeft ? rect.x - ball.r : rect.x + rect.w + ball.r;
    return;
  }
  if (fromTop || fromBottom) {
    ball.vy *= -1;
    ball.y = fromTop ? rect.y - ball.r : rect.y + rect.h + ball.r;
    return;
  }

  const overlapLeft = Math.abs(ball.x + ball.r - rect.x);
  const overlapRight = Math.abs(rect.x + rect.w - (ball.x - ball.r));
  const overlapTop = Math.abs(ball.y + ball.r - rect.y);
  const overlapBottom = Math.abs(rect.y + rect.h - (ball.y - ball.r));
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
  if (minOverlap === overlapLeft || minOverlap === overlapRight) ball.vx *= -1;
  else ball.vy *= -1;
}

function advanceLevel() {
  const levelDuration = performance.now() - game.levelStartedAt;
  const nextLevel = game.level + 1;
  const clearBonus = Math.round(950 + game.level * 240 + Math.max(0, 90000 - levelDuration) / 65 + game.rally * 9);
  game.score += clearBonus;
  game.score = Math.round(game.score);
  game.rally += 4;
  game.highestLevel = Math.max(game.highestLevel || 1, nextLevel);
  playTone(440 + Math.min(420, game.level * 18), 0.18, { type: "triangle", gain: 0.08, slideTo: 880 + Math.min(600, game.level * 20) });
  prepareLevel(nextLevel);
  game.levelClearUntil = performance.now() + 850;
}

function update(dt) {
  if (!game?.running) return;
  const { paddle, ball } = game;
  game.lastDt = dt;
  updateBassPulse(dt);
  const leftPressed = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const rightPressed = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  if (inputMode === "keyboard") {
    const direction = Number(rightPressed) - Number(leftPressed);
    if (direction) {
      paddle.vx += direction * paddle.acceleration * dt;
      paddle.vx = Math.max(-paddle.maxSpeed, Math.min(paddle.maxSpeed, paddle.vx));
    } else {
      const friction = Math.min(1, paddle.friction * dt);
      paddle.vx += (0 - paddle.vx) * friction;
      if (Math.abs(paddle.vx) < 2) paddle.vx = 0;
    }
    paddle.x += paddle.vx * dt;
  } else if (pointerX !== null) {
    const targetX = Math.max(18, Math.min(canvas.width - paddle.w - 18, pointerX - paddle.w / 2));
    const glide = 1 - Math.pow(0.0008, dt);
    paddle.x += (targetX - paddle.x) * glide;
    paddle.vx = (targetX - paddle.x) * 8;
  }
  paddle.x = Math.max(18, Math.min(canvas.width - paddle.w - 18, paddle.x));
  if (paddle.x <= 18 || paddle.x >= canvas.width - paddle.w - 18) paddle.vx = 0;

  if (game.waitingForServe) {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 8;
    updatePowerUps(dt);
    updateRockets(dt);
    updateExplosions(dt);
    updateLasers(dt);
    return;
  }

  updatePowerUps(dt);
  updateRockets(dt);
  updateExplosions(dt);
  updateLasers(dt);

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x < ball.r || ball.x > canvas.width - ball.r) {
    ball.vx *= -1;
    ball.x = Math.max(ball.r, Math.min(canvas.width - ball.r, ball.x));
  }
  if (ball.y < ball.r) {
    ball.vy *= -1;
    ball.y = ball.r;
  }

  if (
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.vy > 0
  ) {
    const hitPosition = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    const config = levelDifficulty(game.level);
    const bounceAngle = clamp(hitPosition, -0.92, 0.92) * 1.08;
    const targetSpeed = clamp((ball.speed || config.speed) + 8 + game.level * 0.55, config.speed, 1080);
    ball.speed = targetSpeed;
    ball.vx = Math.sin(bounceAngle) * targetSpeed;
    ball.vy = -Math.cos(bounceAngle) * targetSpeed;
    game.rally += 1;
    game.score += 20 + game.level * 3 + Math.min(180, game.rally * 5);
    playTone(246.94 + Math.min(260, game.rally * 5), 0.09, { type: "triangle", gain: 0.055 });
  }

  for (const target of game.targets) {
    if (!target.alive) continue;
    if (ball.x + ball.r < target.x || ball.x - ball.r > target.x + target.w || ball.y + ball.r < target.y || ball.y - ball.r > target.y + target.h) continue;
    reflectBallFromRect(target);
    normalizeBallSpeed((ball.speed || levelDifficulty(game.level).speed) + (target.kind === "obstacle" ? 4 : 7));
    if (target.kind === "obstacle") {
      game.rally += 1;
      game.score += 8 + game.level;
      playTone(174.61 + Math.min(120, game.level * 4), 0.08, { type: "square", gain: 0.038 });
    } else {
      destroyTarget(target, 1);
      game.rally += 2;
      game.score += Math.min(360, game.rally * 12) + game.level * 5;
      playTone(target.bonus ? 659.25 : 523.25, 0.13, { type: "sine", gain: target.bonus ? 0.09 : 0.07, slideTo: target.bonus ? 880 : 659.25 });
    }
    break;
  }

  if (ball.y - ball.r > canvas.height) endGame("The rally dropped.");
  if (game.running && game.targets.filter((target) => target.kind !== "obstacle").every((target) => !target.alive)) advanceLevel();
}

let lastFrame = 0;
function tick(timestamp) {
  const dt = Math.min(0.028, (timestamp - lastFrame || 16) / 1000);
  lastFrame = timestamp;
  update(dt);
  draw();
  if (scoreEl && game) scoreEl.textContent = Math.round(game.score).toLocaleString();
  if (levelEl && game) levelEl.textContent = String(game.level || 1);
  if (hitsEl && game) hitsEl.textContent = String(game.hits);
  if (timeEl && game) timeEl.textContent = formatTime((game.endedAt || performance.now()) - game.startedAt);
  if (game?.running) animationId = requestAnimationFrame(tick);
}

async function submitScore(event) {
  event.preventDefault();
  if (!game?.ended || game.submitted || !challenge) return;
  const playerName = playerNameInput?.value.trim() || "GCX Player";
  localStorage.setItem("gcx-rally-name-v1", playerName);
  if (statusEl) statusEl.textContent = "Submitting score...";
  const response = await fetch("/api/arcade/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameId: challenge.gameId,
      seed: challenge.seed,
      playerKey: playerKey(),
      playerName,
      score: Math.round(game.score),
      hits: game.hits,
      level: game.highestLevel || game.level || 1,
      durationMs: Math.round(game.endedAt - game.startedAt),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (statusEl) statusEl.textContent = payload.error || "Score could not be submitted.";
    return;
  }
  game.submitted = true;
  if (submitButton) submitButton.disabled = true;
  challenge = payload.data.challenge;
  leaderboard = payload.data.leaderboard || [];
  renderLeaderboard();
  if (statusEl) statusEl.textContent = "Score posted to today's board.";
}

function bindControls() {
  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable;
    if (isTyping) return;
    if (event.key === " " || event.code === "Space") launchLevel();
    if (movementKeys.includes(event.key)) {
      inputMode = "keyboard";
      pointerX = null;
    }
    keys.add(event.key);
    if ([...movementKeys, " "].includes(event.key)) event.preventDefault();
  });
  window.addEventListener("keyup", (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable;
    if (isTyping) return;
    keys.delete(event.key);
  });
  window.addEventListener("pointermove", (event) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    inputMode = "pointer";
    movementKeys.forEach((key) => keys.delete(key));
    pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  });
  canvas?.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    inputMode = "pointer";
    movementKeys.forEach((key) => keys.delete(key));
    pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    launchLevel();
    canvas.setPointerCapture?.(event.pointerId);
  });
}

async function init() {
  if (!canvas || !ctx) return;
  bindControls();
  playerNameInput.value = localStorage.getItem("gcx-rally-name-v1") || "";
  bestEl.textContent = Number(localStorage.getItem(bestStorageKey) || 0).toLocaleString();
  try {
    await loadDailyChallenge();
    setInterval(updateCountdown, 1000);
    startButton?.addEventListener("click", resetGame);
    soundToggle?.addEventListener("click", () => {
      const system = initAudio();
      if (!system) return;
      system.muted = !system.muted;
      localStorage.setItem(soundMutedStorageKey, system.muted ? "true" : "false");
      system.master.gain.setTargetAtTime(system.muted ? 0 : 0.16, system.context.currentTime, 0.04);
      if (!system.muted && system.context.state === "suspended") system.context.resume();
      updateSoundToggle();
    });
    updateSoundToggle();
    setArcadeMaximized(false);
    maximizeToggle?.addEventListener("click", toggleArcadeMaximized);
    document.addEventListener("fullscreenchange", () => {
      setArcadeMaximized(document.fullscreenElement === arcadeStage);
    });
    submitForm?.addEventListener("submit", submitScore);
    game = {
      running: false,
      ended: false,
      startedAt: performance.now(),
      score: 0,
      level: 1,
      highestLevel: 1,
      levelStartedAt: performance.now(),
      levelClearUntil: 0,
      hits: 0,
      rally: 0,
      beatTimer: 0,
      bassPulse: 0,
      paddle: { x: canvas.width / 2 - 72, y: canvas.height - 58, w: 144, h: 16, vx: 0, maxSpeed: 760, acceleration: 4200, friction: 9 },
      ball: { x: canvas.width / 2, y: canvas.height - 92, r: 10, vx: 0, vy: -360, speed: 365 },
      targets: generateLevelObjects(challenge.seed, 1),
    };
    if (levelEl) levelEl.textContent = "1";
    draw();
  } catch (error) {
    if (statusEl) statusEl.textContent = error.message;
    if (leaderboardEl) leaderboardEl.innerHTML = "<li>Arcade data is unavailable right now.</li>";
  }
}

init();
