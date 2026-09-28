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
- Power-up "Escudo" (`type = 'escudo'`): 10% drop from destroyed asteroids and shooting stars; collecting sets `ship.shieldTimer = SHIELD_DURATION` and draws a cyan pulsing bubble around the ship that cancels collisions (asteroids/stars pass through, ship survives, no points, no destroy); HUD bar below the Velocidad one.
- Power-up "Triple shot" (`type = 'triple'`): 25% drop from destroyed asteroids and shooting stars (pickup with ttl); collecting sets `ship.tripleTimer = POWERUP_DURATION` so `tryShoot()` fires 3 parallel bullets perpendicular to heading; HUD bar bottom-left. PowerUp has `type` ('velocidad' | 'escudo' | 'triple').
- "Estrella fugaz" (`ShootingStar`): 10% spawn on asteroid kill; fast gold star with two-pass trail, propulsion sparks, glow halo and twinkle, worth `SHOOTING_STAR_POINTS` (200), no split; fades out over last `SHOOTING_STAR_FADE` s of its `SHOOTING_STAR_TTL` lifetime with a final spark burst; may drop power-up (25%).
- Skins: array `SKINS` (silueta `verts`, `color`, `flame*`, `nose`, `glow`, `cockpit`, `spread`), selectable with keys `1`–`SKINS.length` and persisted in `localStorage` (`asteroids.skin`). Skin `spread` is the TOTAL fan angle in radians: `0` = one straight bullet, `> 0` = double dispersed shot (2 bullets at ±spread/2) with `SPREAD_MOUTH` px between muzzles. "ESCOPETA" is the only spread skin (`spread: 0.4`).
- Spread ships ignore the "Triple shot" parallel pattern: with `ship.tripleTimer > 0` they fire 3 bullets evenly fanned across the same `spread` instead.
- All movement wraps edges (`wrap()`); collisions use `dist()` circle checks.

## CI
- `.github/workflows/issue-triage.yml` runs on `issues: [opened, edited, reopened]` (plus manual `workflow_dispatch` with an `issue_number` input). Job `triage` (deterministic) prefixes the title (`[Bug]`, `[Feature]`, `[Mejora]`, `[Docs]`, `[Pregunta]`, `[Duplicado]`), applies type + area labels, and appends a `<details>` block at the end of the body with matching `game.js` lines, balance constants and possible duplicates. Jobs `ai` / `link` add an opencode analysis comment only when keywords are not enough (`deep` output).
- The triage block is delimited by `<!-- triage:start -->` / `<!-- triage:end -->` and is **regenerated**, never appended twice; it is also excluded from its own keyword analysis. The issue author's text is never modified.
- The block also carries a hidden `<!-- triage-labels: a,b,c -->` marker listing the labels the action applied last run. Each new run removes labels in that marker that the fresh classification no longer justifies (never labels a human applied). Issues triaged before this marker existed treat the managed labels already on them as auto-applied, so a re-run self-heals them.
- When the deterministic triage can't determine the type (block shows `_sin determinar_` / `help wanted`), the agent is asked to close its `<!-- triage-ia -->` comment with a suggested label line (`bug`, `enhancement`, `documentation`, `question`, `duplicate`) — the human applies it, the agent never touches labels.
- Area labels used by the triage: `power-up`, `escudo`, `skins`, `estrella-fugaz`, `colisiones`, `hud`, `balance`, `controles`, `render` (plus `needs-info`). If you add a game feature, add its keywords and code needles to the `AREAS` table so issues about it get labelled.
- Keyword matching requires word boundaries (`\b…\b`), so list exact plurals/variants (e.g. `colision` and `colisiones`, not a prefix stem). Bots file issues in English, so common English keywords are included too.

## Gotchas
- Canvas is hardcoded 800×600 in BOTH `index.html` and `game.js` (W/H) — keep in sync.
- Keyboard input uses `e.code` values (e.g. 'Space', 'ArrowUp').
- UI text and code comments are in Spanish — keep that style.
