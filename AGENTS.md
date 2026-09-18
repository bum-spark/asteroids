# AGENTS.md

## Stack
- Vanilla HTML5 Canvas game. No framework, bundler, package.json, tests, or lint config.
- All game logic in a single plain script `game.js` — do NOT use ES modules (import/export).

## Run / verify
- Open `index.html` in a browser, or serve the folder (e.g. `npx serve .`).
- Syntax check only: `node --check game.js`. No test/lint commands exist.

## Architecture (game.js)
- `update(dt)` / `draw()` driven by `requestAnimationFrame`; dt capped at 0.05s.
- Game states: 'playing' | 'dead' | 'gameover'.
- Entities: classes `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, `ShootingStar`. Asteroid `size` is 1-3; `RADII`, `SPEEDS`, `POINTS` arrays are indexed by size.
- Power-up "Velocidad": 25% drop from destroyed asteroids (pickup with ttl); collecting sets `ship.speedTimer = POWERUP_DURATION` and doubles thrust; HUD bar bottom-left.
- "Estrella fugaz" (`ShootingStar`): 10% spawn on asteroid kill; fast gold star with two-pass trail, propulsion sparks, glow halo and twinkle, worth `SHOOTING_STAR_POINTS` (200), no split; fades out over last `SHOOTING_STAR_FADE` s of its `SHOOTING_STAR_TTL` lifetime with a final spark burst; may drop power-up (25%).
- All movement wraps edges (`wrap()`); collisions use `dist()` circle checks.

## Gotchas
- Canvas is hardcoded 800×600 in BOTH `index.html` and `game.js` (W/H) — keep in sync.
- Keyboard input uses `e.code` values (e.g. 'Space', 'ArrowUp').
- UI text and code comments are in Spanish — keep that style.
