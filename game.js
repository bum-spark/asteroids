'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const SHOOTING_STAR_POINTS = 200;
const SHOOTING_STAR_TTL    = 6;    // segundos de vida
const SHOOTING_STAR_FADE   = 1.5;  // últimos segundos de desvanecimiento

class ShootingStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(200, 260);   // más rápida que un asteroide normal
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-2.5, 2.5);
    this.rot      = rand(0, Math.PI * 2);
    this.phase    = rand(0, Math.PI * 2);
    this.ttl   = SHOOTING_STAR_TTL;
    this.trail = [];
    this.dead  = false;
  }

  fade() {
    return Math.max(0, Math.min(1, this.ttl / SHOOTING_STAR_FADE));
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot   += this.rotSpeed * dt;
    this.phase += dt * 10;
    this.ttl   -= dt;

    // Al agotarse: ráfaga final de chispas doradas y blancas
    if (this.ttl <= 0) {
      for (let i = 0; i < 12; i++)
        particles.push(new Particle(this.x, this.y,
          i % 3 === 0 ? '#fff' : '#ffd700', null, null, rand(0.3, 0.8)));
      this.dead = true;
      return;
    }

    // Estela: historial de posiciones (se resetea si cruza un borde)
    const last = this.trail[this.trail.length - 1];
    if (last && Math.hypot(this.x - last.x, this.y - last.y) > 60) this.trail = [];
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 20) this.trail.shift();

    const fade = this.fade();

    // Chispas de propulsión desde la parte trasera
    const speed = Math.hypot(this.vx, this.vy);
    const bx = this.x - (this.vx / speed) * this.radius;
    const by = this.y - (this.vy / speed) * this.radius;
    if (Math.random() < 0.9 * fade) {
      particles.push(new Particle(
        bx + rand(-3, 3), by + rand(-3, 3), '#ffd700',
        this.vx * 0.2 + rand(-25, 25), this.vy * 0.2 + rand(-25, 25),
        rand(0.3, 0.7)
      ));
    }

    // Destellos dorados alrededor de la estrella
    if (Math.random() < 0.3 * fade) {
      const ox = this.x + rand(-this.radius, this.radius);
      const oy = this.y + rand(-this.radius, this.radius);
      particles.push(new Particle(ox, oy, '#ffd700', null, null, rand(0.3, 0.6)));
    }
  }

  drawTrail() {
    const n = this.trail.length;
    if (n < 2) return;
    const fade = this.fade();
    ctx.lineCap = 'round';

    // Pasada ancha y suave (halo naranja de la estela)
    for (let i = 1; i < n; i++) {
      const t = i / n;
      ctx.strokeStyle = `rgba(255, 165, 0, ${(t * t * 0.22 * fade).toFixed(3)})`;
      ctx.lineWidth = 2 + t * 7;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
    }

    // Pasada fina y brillante (núcleo blanco-dorado)
    for (let i = 1; i < n; i++) {
      const t = i / n;
      ctx.strokeStyle = `rgba(255, 240, 180, ${(t * 0.55 * fade).toFixed(3)})`;
      ctx.lineWidth = 0.6 + t * 2.2;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  draw() {
    const fade = this.fade();
    const pulse = 1 + Math.sin(this.phase) * 0.12;

    // Halo de glow radial
    const glowR = this.radius * 2.6;
    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
    glow.addColorStop(0, `rgba(255, 215, 0, ${(0.25 * fade).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
    ctx.fill();

    this.drawTrail();

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Estrella de 5 puntas
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 === 0) ? this.radius : this.radius * 0.45;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Destello blanco de 4 puntas cerca del pico del parpadeo
    const twinkle = Math.max(0, Math.sin(this.phase));
    if (twinkle > 0.85) {
      const a = (twinkle - 0.85) / 0.15;
      ctx.globalAlpha = a * 0.9 * fade;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      const s = this.radius * (1.3 + a * 0.5);
      ctx.beginPath();
      ctx.moveTo(this.x - s, this.y);
      ctx.lineTo(this.x + s, this.y);
      ctx.moveTo(this.x, this.y - s);
      ctx.lineTo(this.x, this.y + s);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
// Cada skin define la silueta (verts), colores y llama de la nave.
const SKINS = [
  {
    name: 'CLÁSICA',
    color: '#fff',
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    nose: 21,
    flameX: -8,
    flame: 'rgba(255, 130, 0, 0.85)',
    flameHalf: 4,
    flameLen: 14,
    glow: null,
    cockpit: null,
  },
  {
    name: 'FÉNIX',
    color: '#ffb300',
    verts: [[26, 0], [-6, -14], [-12, 0], [-6, 14]],
    nose: 27,
    flameX: -12,
    flame: 'rgba(255, 200, 0, 0.9)',
    flameHalf: 5,
    flameLen: 18,
    glow: 'rgba(255, 170, 0, 0.12)',
    cockpit: [10, 0],
  },
  {
    name: 'VÍBORA',
    color: '#4ade80',
    verts: [[30, 0], [-10, -7], [-13, 0], [-10, 7]],
    nose: 31,
    flameX: -12,
    flame: 'rgba(0, 220, 120, 0.85)',
    flameHalf: 3,
    flameLen: 20,
    glow: 'rgba(74, 222, 128, 0.10)',
    cockpit: [12, 0],
  },
  {
    name: 'SOMBRA',
    color: '#6de6ff',
    verts: [[24, 0], [-10, -12], [-6, 0], [-10, 12]],
    nose: 25,
    flameX: -9,
    flame: 'rgba(60, 200, 255, 0.85)',
    flameHalf: 5,
    flameLen: 16,
    glow: 'rgba(109, 230, 255, 0.12)',
    cockpit: [9, 0],
  },
  {
    name: 'NOVA',
    color: '#ff5cf0',
    verts: [[20, 0], [-14, -8], [-9, 0], [-14, 8]],
    nose: 21,
    flameX: -12,
    flame: 'rgba(255, 90, 220, 0.85)',
    flameHalf: 4,
    flameLen: 15,
    glow: 'rgba(255, 92, 240, 0.12)',
    cockpit: [8, 0],
  },
];

const SKIN_STORAGE_KEY = 'asteroids.skin';

function loadSkinIndex() {
  try {
    const saved = parseInt(localStorage.getItem(SKIN_STORAGE_KEY), 10);
    if (Number.isInteger(saved) && saved >= 0 && saved < SKINS.length) return saved;
  } catch (e) { /* localStorage no disponible */ }
  return 0;
}

function saveSkin(index) {
  try { localStorage.setItem(SKIN_STORAGE_KEY, String(index)); } catch (e) { /* noop */ }
}

function selectSkin(index) {
  if (index < 0 || index >= SKINS.length || index === skinIndex) return;
  skinIndex = index;
  saveSkin(skinIndex);
}

let skinIndex = loadSkinIndex();

// Dibuja la nave (o icono) usando una skin; requiere translate/rotate aplicados.
function drawSkinShip(skin, scale = 1) {
  ctx.save();
  if (scale !== 1) ctx.scale(scale, scale);

  // Halo de glow detrás de la nave
  if (skin.glow) {
    const gR = 34;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, gR);
    glow.addColorStop(0, skin.glow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, gR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Silueta de la nave
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.5;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
  ctx.closePath();
  ctx.stroke();

  // Cabina decorativa
  if (skin.cockpit) {
    ctx.fillStyle = skin.color;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(skin.cockpit[0], skin.cockpit[1], 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.shieldTimer   = 0;
    this.tripleTimer   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (this.speedTimer > 0) this.speedTimer -= dt;
    const thrust = this.speedTimer > 0 ? THRUST * 2 : THRUST;  // power-up Velocidad

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const skin = SKINS[skinIndex];
    const ox = this.x + Math.cos(this.angle) * skin.nose;
    const oy = this.y + Math.sin(this.angle) * skin.nose;

    // Power-up triple shot: 3 balas paralelas en línea recta
    if (this.tripleTimer > 0) {
      const PERP = 8;   // separación perpendicular entre balas
      const px = -Math.sin(this.angle) * PERP;
      const py =  Math.cos(this.angle) * PERP;
      return [
        new Bullet(ox - px, oy - py, this.angle),
        new Bullet(ox,        oy,        this.angle),
        new Bullet(ox + px, oy + py, this.angle),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    drawSkinShip(skin);

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(skin.flameX, -skin.flameHalf);
      ctx.lineTo(skin.flameX - rand(skin.flameLen * 0.45, skin.flameLen), 0);
      ctx.lineTo(skin.flameX, skin.flameHalf);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();

    // Burbuja del escudo
    if (this.shieldTimer > 0) {
      const frac = this.shieldTimer / SHIELD_DURATION;
      const pulse = 1 + Math.sin(performance.now() / 120) * 0.06;
      const r = 30 * pulse;
      const glow = ctx.createRadialGradient(this.x, this.y, r * 0.4, this.x, this.y, r);
      glow.addColorStop(0, `rgba(0, 229, 255, ${(0.28 * frac).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(0, 229, 255, ${(0.7 * frac).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '#fff', vx = null, vy = null, life = null) {
    this.x  = x;
    this.y  = y;
    this.color = color;
    if (vx !== null && vy !== null) {
      this.vx = vx;
      this.vy = vy;
    } else {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(30, 130);
      this.vx   = Math.cos(angle) * speed;
      this.vy   = Math.sin(angle) * speed;
    }
    this.life = life !== null ? life : rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
const POWERUP_DURATION = 5;   // segundos de efecto de Velocidad / Triple shot
const SHIELD_DURATION  = 6;   // segundos de protección del Escudo

class PowerUp {
  constructor(x, y, type = 'velocidad') {
    this.type = type;
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl   = 10;
    this.phase = rand(0, Math.PI * 2);
    this.dead  = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    this.phase += dt * 6;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const isShield = this.type === 'escudo';
    const isTriple = this.type === 'triple';
    const color = isShield ? '#00e5ff' : (isTriple ? '#00d5ff' : '#ffd700');
    const label = isShield ? 'E' : (isTriple ? '3' : 'V');
    const pulse = 1 + Math.sin(this.phase) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  shootingStars = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Selección de skin con teclas numéricas
  for (let i = 1; i <= SKINS.length; i++) {
    if (pressed('Digit' + i)) selectSkin(i - 1);
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        if (Math.random() < 0.25) powerups.push(new PowerUp(a.x, a.y, 'velocidad'));
        if (Math.random() < 0.10) powerups.push(new PowerUp(a.x, a.y, 'escudo'));
        if (Math.random() < 0.25) powerups.push(new PowerUp(a.x, a.y, 'triple'));
        if (Math.random() < 0.10) shootingStars.push(new ShootingStar(a.x, a.y));
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS;
        explode(s.x, s.y, 20);
        if (Math.random() < 0.25) powerups.push(new PowerUp(s.x, s.y, 'velocidad'));
        if (Math.random() < 0.10) powerups.push(new PowerUp(s.x, s.y, 'escudo'));
        if (Math.random() < 0.25) powerups.push(new PowerUp(s.x, s.y, 'triple'));
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide / estrella fugaz (el escudo protege sin destruirlos)
  if (ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
    for (const s of shootingStars) {
      if (!ship.dead && dist(ship, s) < ship.radius + s.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerups) {
      if (dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if (p.type === 'escudo') {
          ship.shieldTimer = SHIELD_DURATION;
        } else if (p.type === 'triple') {
          ship.tripleTimer = POWERUP_DURATION;
        } else {
          ship.speedTimer = POWERUP_DURATION;
        }
        explode(p.x, p.y, 6);
      }
    }
    powerups = powerups.filter(p => !p.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  drawSkinShip(SKINS[skinIndex], 0.45);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicador de skin
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`NAVE: ${SKINS[skinIndex].name}   [1-${SKINS.length}]`, W / 2, H - 14);
}

function drawEffectBar(label, color, timer, duration, y) {
  const x = 14;
  const w = 170;
  const h = 16;
  const frac = timer / duration;

  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`${label}  ${timer.toFixed(1)}s`, x, y - 10);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, (w - 4) * frac, h - 4);
}

function drawPowerUpBars() {
  if (state !== 'playing') return;
  if (ship.speedTimer  > 0) drawEffectBar('VELOCIDAD',   '#ffd700', ship.speedTimer,  POWERUP_DURATION, H - 112);
  if (ship.shieldTimer > 0) drawEffectBar('ESCUDO',      '#00e5ff', ship.shieldTimer, SHIELD_DURATION,  H - 74);
  if (ship.tripleTimer > 0) drawEffectBar('TRIPLE SHOT', '#00d5ff', ship.tripleTimer, POWERUP_DURATION, H - 36);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  shootingStars.forEach(s => s.draw());
  ship.draw();

  drawHUD();
  drawPowerUpBars();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);