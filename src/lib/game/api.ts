// Client for the leaderboard worker (see /worker).
import type { InputLog } from './sim';

/** URL of the deployed worker (https://bughunt-leaderboard.<account>.workers.dev). */
const PRODUCTION_API = 'https://bughunt-leaderboard.bughunt-leaderboard.workers.dev';

/**
 * Base URL of the leaderboard. Empty = leaderboard disabled, the game still works.
 * Override with VITE_SCORE_API, e.g. http://localhost:8799 while running `wrangler dev`.
 */
export const SCORE_API: string = import.meta.env.VITE_SCORE_API ?? PRODUCTION_API;

export type Entry = { name: string; score: number; wave: number };
export type Session = { id: string; seed: number };
export type SubmitResult = { score: number; rank: number; top: Entry[] };

export const online = SCORE_API !== '';

const post = async <T>(path: string, body?: unknown): Promise<T> => {
	const res = await fetch(SCORE_API + path, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body ?? {})
	});
	if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
	return res.json();
};

export const newSession = () => post<Session>('/session');

export const submitScore = (id: string, name: string, inputs: InputLog) =>
	post<SubmitResult>('/score', { id, name, inputs });

/** Live top 10: initial list on connect, then a push on every new record. */
export const watchScores = (onScores: (top: Entry[]) => void) => {
	if (!online) return () => {};
	let ws: WebSocket | undefined;
	let closed = false;
	let retry: ReturnType<typeof setTimeout> | undefined;
	const connect = () => {
		ws = new WebSocket(SCORE_API.replace(/^http/, 'ws') + '/ws');
		ws.onmessage = (e) => {
			try {
				onScores(JSON.parse(e.data));
			} catch {
				// ignore malformed frames
			}
		};
		ws.onclose = () => {
			if (!closed) retry = setTimeout(connect, 5000);
		};
	};
	connect();
	return () => {
		closed = true;
		clearTimeout(retry);
		ws?.close();
	};
};
