// Bug Hunt leaderboard: a Cloudflare Worker in front of one Durable Object.
//
// The client never sends a score. It asks for a session (a random seed), plays,
// and sends back the log of its inputs. The Durable Object replays the game with
// the same simulation code the browser runs and stores the score it computes.
import { DurableObject } from 'cloudflare:workers';
import { MAX_TICKS, TICK_HZ, replay, type InputLog } from '../../src/lib/game/sim';

type Env = {
	LEADERBOARD: DurableObjectNamespace<Leaderboard>;
	ALLOWED_ORIGINS: string;
};

type Entry = { name: string; score: number; wave: number };

const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_INPUTS = 20_000;
const KEEP_SCORES = 100;
const SESSIONS_PER_WINDOW = 30;
const WINDOW_MS = 10 * 60 * 1000;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json' }
	});

const fail = (message: string, status = 400) => new Response(message, { status });

const parseInputs = (value: unknown): InputLog | null => {
	if (!Array.isArray(value) || value.length > MAX_INPUTS) return null;
	let last = 0;
	for (const entry of value) {
		if (!Array.isArray(entry) || entry.length !== 2) return null;
		const [tick, mask] = entry;
		if (!Number.isInteger(tick) || !Number.isInteger(mask)) return null;
		if (tick < last || tick > MAX_TICKS || mask < 0 || mask > 7) return null;
		last = tick;
	}
	return value as InputLog;
};

export class Leaderboard extends DurableObject<Env> {
	private sql: SqlStorage;
	private hits = new Map<string, { count: number; since: number }>();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sql = ctx.storage.sql;
		this.sql.exec(`
			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				seed INTEGER NOT NULL,
				issued_at INTEGER NOT NULL
			);
			CREATE TABLE IF NOT EXISTS scores (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				score INTEGER NOT NULL,
				wave INTEGER NOT NULL,
				ticks INTEGER NOT NULL,
				seed INTEGER NOT NULL,
				inputs TEXT NOT NULL,
				created_at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS scores_by_score ON scores (score DESC, id ASC);
		`);
	}

	private top(): Entry[] {
		return this.sql
			.exec<Entry>('SELECT name, score, wave FROM scores ORDER BY score DESC, id ASC LIMIT 10')
			.toArray();
	}

	private limited(ip: string, now: number) {
		const hit = this.hits.get(ip);
		if (!hit || now - hit.since > WINDOW_MS) {
			this.hits.set(ip, { count: 1, since: now });
			if (this.hits.size > 5000) this.hits.clear();
			return false;
		}
		return ++hit.count > SESSIONS_PER_WINDOW;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const now = Date.now();

		if (url.pathname === '/ws') {
			if (request.headers.get('upgrade') !== 'websocket') return fail('Expected websocket', 426);
			const pair = new WebSocketPair();
			this.ctx.acceptWebSocket(pair[1]);
			pair[1].send(JSON.stringify(this.top()));
			return new Response(null, { status: 101, webSocket: pair[0] });
		}

		if (url.pathname === '/scores' && request.method === 'GET') return json(this.top());

		if (url.pathname === '/session' && request.method === 'POST') {
			const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
			if (this.limited(ip, now)) return fail('Too many games, slow down', 429);
			this.sql.exec('DELETE FROM sessions WHERE issued_at < ?', now - SESSION_TTL_MS);
			const id = crypto.randomUUID();
			const seed = crypto.getRandomValues(new Int32Array(1))[0];
			this.sql.exec('INSERT INTO sessions (id, seed, issued_at) VALUES (?, ?, ?)', id, seed, now);
			return json({ id, seed });
		}

		if (url.pathname === '/score' && request.method === 'POST') {
			let body: { id?: unknown; name?: unknown; inputs?: unknown };
			try {
				body = await request.json();
			} catch {
				return fail('Invalid JSON');
			}
			const name = typeof body.name === 'string' ? body.name.toUpperCase() : '';
			if (!/^[A-Z0-9]{3}$/.test(name)) return fail('Name must be 3 letters or digits');
			const inputs = parseInputs(body.inputs);
			if (!inputs) return fail('Invalid input log');
			if (typeof body.id !== 'string') return fail('Missing session');

			const session = this.sql
				.exec<{
					seed: number;
					issued_at: number;
				}>('SELECT seed, issued_at FROM sessions WHERE id = ?', body.id)
				.toArray()[0];
			if (!session || now - session.issued_at > SESSION_TTL_MS) {
				return fail('Unknown or expired session', 410);
			}
			// a session is good for one submission, valid or not
			this.sql.exec('DELETE FROM sessions WHERE id = ?', body.id);

			const game = replay(session.seed, inputs);
			if (!game.over) return fail('The game is not over');
			if (game.score <= 0) return fail('Nothing to save');
			// the run cannot be longer than the time since the seed was handed out
			if (game.tick / TICK_HZ > (now - session.issued_at) / 1000 + 5) {
				return fail('Run is longer than the session');
			}

			this.sql.exec(
				'INSERT INTO scores (name, score, wave, ticks, seed, inputs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
				name,
				game.score,
				game.wave,
				game.tick,
				session.seed,
				JSON.stringify(inputs),
				now
			);
			this.sql.exec(
				'DELETE FROM scores WHERE id NOT IN (SELECT id FROM scores ORDER BY score DESC, id ASC LIMIT ?)',
				KEEP_SCORES
			);
			const rank =
				this.sql
					.exec<{ n: number }>('SELECT COUNT(*) AS n FROM scores WHERE score > ?', game.score)
					.one().n + 1;

			const top = this.top();
			const message = JSON.stringify(top);
			for (const ws of this.ctx.getWebSockets()) {
				try {
					ws.send(message);
				} catch {
					// socket already gone
				}
			}
			return json({ score: game.score, rank, top });
		}

		return fail('Not found', 404);
	}

	// Hibernatable WebSockets: clients only listen, nothing to do with their messages.
	webSocketMessage() {}

	webSocketClose(ws: WebSocket, code: number) {
		try {
			ws.close(code === 1005 || code === 1006 ? 1000 : code);
		} catch {
			// already closed
		}
	}
}

const allowedOrigin = (origin: string | null, env: Env) => {
	if (!origin) return null;
	if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
	return env.ALLOWED_ORIGINS.split(',')
		.map((o) => o.trim())
		.includes(origin)
		? origin
		: null;
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = allowedOrigin(request.headers.get('origin'), env);
		const cors: Record<string, string> = origin
			? {
					'access-control-allow-origin': origin,
					'access-control-allow-methods': 'GET, POST, OPTIONS',
					'access-control-allow-headers': 'content-type',
					'access-control-max-age': '86400',
					vary: 'origin'
				}
			: {};

		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
		// browsers always send Origin on cross-site POST and WebSocket requests
		if (!origin && (request.method !== 'GET' || request.headers.get('upgrade'))) {
			return fail('Origin not allowed', 403);
		}

		const stub = env.LEADERBOARD.get(env.LEADERBOARD.idFromName('global'));
		const response = await stub.fetch(request);
		if (response.status === 101) return response;
		const headers = new Headers(response.headers);
		for (const [key, value] of Object.entries(cors)) headers.set(key, value);
		return new Response(response.body, { status: response.status, headers });
	}
} satisfies ExportedHandler<Env>;
