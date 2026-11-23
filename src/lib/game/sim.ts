// Deterministic simulation of Bug Hunt.
//
// No DOM, no Math.random, no wall clock: the same seed and the same input log
// always produce the same game. The browser runs it to play, the leaderboard
// worker runs it again to compute the score on its own.

export const W = 480;
export const H = 560;
export const PLAYER_Y = H - 44;
export const TICK_HZ = 60;
export const DT = 1 / TICK_HZ;
/** Hard cap on a single run: 30 minutes. */
export const MAX_TICKS = TICK_HZ * 60 * 30;

export const LEFT = 1;
export const RIGHT = 2;
export const FIRE = 4;

export const ROWS = [
	{ glyph: '{}', color: '#ff5d73', points: 50 },
	{ glyph: '<>', color: '#ffd23f', points: 40 },
	{ glyph: '[]', color: '#ffd23f', points: 30 },
	{ glyph: '()', color: '#5cc8ff', points: 20 },
	{ glyph: ';;', color: '#5cc8ff', points: 10 }
];
export const COLS = 9;

export type Bug = { x: number; y: number; col: number; row: number; alive: boolean };
export type Shot = { x: number; y: number };
/** One entry per input change: from `tick` on, `mask` is held. */
export type InputLog = [tick: number, mask: number][];

export type Sim = {
	rng: number;
	tick: number;
	over: boolean;
	score: number;
	lives: number;
	wave: number;
	px: number;
	dir: number;
	cooldown: number;
	invulnerable: number;
	fireTimer: number;
	bugs: Bug[];
	alive: number;
	shots: Shot[];
	bombs: Shot[];
	/** Bugs destroyed during the last step (for the renderer). */
	kills: Shot[];
};

// mulberry32
const random = (s: Sim) => {
	s.rng = (s.rng + 0x6d2b79f5) | 0;
	let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const spawnWave = (s: Sim) => {
	s.bugs = [];
	for (let row = 0; row < ROWS.length; row++) {
		for (let col = 0; col < COLS; col++) {
			s.bugs.push({ x: 34 + col * 44, y: 76 + row * 32, col, row, alive: true });
		}
	}
	s.alive = s.bugs.length;
	s.shots = [];
	s.bombs = [];
	s.dir = 1;
	s.fireTimer = 1;
};

export const createSim = (seed: number): Sim => {
	const s: Sim = {
		rng: seed | 0,
		tick: 0,
		over: false,
		score: 0,
		lives: 3,
		wave: 1,
		px: W / 2 - 15,
		dir: 1,
		cooldown: 0,
		invulnerable: 0,
		fireTimer: 1,
		bugs: [],
		alive: 0,
		shots: [],
		bombs: [],
		kills: []
	};
	spawnWave(s);
	return s;
};

/** Advance the game by one tick with the given input mask. */
export const step = (s: Sim, input: number) => {
	s.kills.length = 0;
	if (s.over) return;
	s.tick++;

	if (input & LEFT) s.px -= 250 * DT;
	if (input & RIGHT) s.px += 250 * DT;
	if (s.px < 10) s.px = 10;
	if (s.px > W - 40) s.px = W - 40;
	s.cooldown -= DT;
	s.invulnerable -= DT;

	if (input & FIRE && s.cooldown <= 0 && s.shots.length < 3) {
		s.shots.push({ x: s.px + 13.5, y: PLAYER_Y - 10 });
		s.cooldown = 0.3;
	}

	if (s.alive === 0) {
		s.wave++;
		spawnWave(s);
		return;
	}

	// the fewer bugs left, the faster they move
	const speed = (20 + s.wave * 6) * (1 + (1 - s.alive / s.bugs.length) * 3);
	const dx = s.dir * speed * DT;
	let edge = false;
	for (const b of s.bugs) {
		if (!b.alive) continue;
		b.x += dx;
		if (b.x < 10 || b.x + 26 > W - 10) edge = true;
	}
	if (edge) {
		for (const b of s.bugs) {
			if (!b.alive) continue;
			b.x -= dx;
			b.y += 14;
		}
		s.dir = -s.dir;
	}
	for (const b of s.bugs) {
		if (b.alive && b.y + 16 >= PLAYER_Y) {
			s.over = true;
			return;
		}
	}

	// player shots
	let n = 0;
	for (const shot of s.shots) {
		shot.y -= 430 * DT;
		let hit = false;
		for (const b of s.bugs) {
			if (!b.alive) continue;
			if (shot.x >= b.x - 2 && shot.x <= b.x + 26 && shot.y <= b.y + 16 && shot.y + 10 >= b.y) {
				b.alive = false;
				s.alive--;
				s.score += ROWS[b.row].points;
				s.kills.push({ x: b.x, y: b.y });
				hit = true;
				break;
			}
		}
		if (!hit && shot.y > -12) s.shots[n++] = shot;
	}
	s.shots.length = n;

	// bugs fire back: the lowest bug of a random column
	s.fireTimer -= DT;
	if (s.fireTimer <= 0 && s.alive > 0) {
		let target = Math.floor(random(s) * s.alive);
		let col = 0;
		for (const b of s.bugs) {
			if (!b.alive) continue;
			if (target-- === 0) {
				col = b.col;
				break;
			}
		}
		let shooter: Bug | null = null;
		for (const b of s.bugs) {
			if (b.alive && b.col === col && (!shooter || b.y > shooter.y)) shooter = b;
		}
		if (shooter) s.bombs.push({ x: shooter.x + 12, y: shooter.y + 16 });
		s.fireTimer = Math.max(0.35, 1.2 - s.wave * 0.1) * (0.6 + random(s) * 0.8);
	}

	n = 0;
	const bombSpeed = (170 + s.wave * 12) * DT;
	for (const bomb of s.bombs) {
		bomb.y += bombSpeed;
		if (bomb.y > H) continue;
		const hit =
			s.invulnerable <= 0 &&
			bomb.x >= s.px &&
			bomb.x <= s.px + 30 &&
			bomb.y + 10 >= PLAYER_Y &&
			bomb.y <= PLAYER_Y + 14;
		if (hit) {
			s.lives--;
			s.invulnerable = 1.5;
			if (s.lives <= 0) s.over = true;
			continue;
		}
		s.bombs[n++] = bomb;
	}
	s.bombs.length = n;
};

/** Re-run a whole game from its seed and input log. */
export const replay = (seed: number, log: InputLog, maxTicks = MAX_TICKS): Sim => {
	const s = createSim(seed);
	let i = 0;
	let input = 0;
	while (!s.over && s.tick < maxTicks) {
		while (i < log.length && log[i][0] <= s.tick) input = log[i++][1];
		step(s, input);
	}
	return s;
};
