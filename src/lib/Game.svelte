<script lang="ts">
	import { onMount } from 'svelte';
	import { arcade } from './ui-state.svelte';
	import {
		DT,
		FIRE,
		H,
		LEFT,
		PLAYER_Y,
		RIGHT,
		ROWS,
		W,
		createSim,
		step,
		type InputLog
	} from './game/sim';
	import {
		newSession,
		online,
		submitScore,
		watchScores,
		type Entry,
		type Session
	} from './game/api';

	// BUG HUNT: shoot the bugs before they reach production.
	const HI_KEY = 'bughunt-hi';
	const NAME_KEY = 'bughunt-name';

	type Status = 'ready' | 'playing' | 'paused' | 'over';
	/** A finished run that the leaderboard can verify. */
	type Run = { session: Session; inputs: InputLog; score: number };

	let canvas: HTMLCanvasElement;
	let dialog: HTMLDivElement;
	const keys = { left: false, right: false, fire: false };
	// a tap shorter than one tick must still fire once
	let fireLatch = false;
	let action: () => void = () => {};

	let top = $state<Entry[]>([]);
	let run = $state<Run | null>(null);
	let name = $state('');
	let saving = $state(false);
	let message = $state('');

	const close = () => (arcade.game = false);

	const save = async (e: SubmitEvent) => {
		e.preventDefault();
		if (!run || saving) return;
		const initials = name.toUpperCase();
		if (!/^[A-Z0-9]{3}$/.test(initials)) {
			message = 'Use 3 letters or digits';
			return;
		}
		saving = true;
		message = '';
		try {
			const result = await submitScore(run.session.id, initials, $state.snapshot(run.inputs));
			top = result.top;
			message = `Saved! Rank #${result.rank}`;
			run = null;
			try {
				localStorage.setItem(NAME_KEY, initials);
			} catch {
				// ignore
			}
		} catch (err) {
			message = err instanceof Error ? err.message : 'Could not save';
		} finally {
			saving = false;
		}
	};

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = W * dpr;
		canvas.height = H * dpr;
		ctx.scale(dpr, dpr);

		let hi = 0;
		try {
			hi = Number(localStorage.getItem(HI_KEY)) || 0;
			name = localStorage.getItem(NAME_KEY) ?? '';
		} catch {
			// storage unavailable: play without saved hi-score and initials
		}

		let status: Status = 'ready';
		let sim = createSim(0);
		let inputs: InputLog = [];
		let lastInput = 0;
		let session: Session | null = null; // the one this run is played on
		let nextSession: Session | null = null; // fetched ahead, so starting is instant
		let overAt = 0;
		let clock = 0;
		let acc = 0;
		let sparks: { x: number; y: number; t: number }[] = [];

		let pending: Promise<unknown> | null = null;
		let starting = false;
		let mounted = true;

		const prefetch = () => {
			if (!online) return;
			nextSession = null;
			pending = newSession()
				.then((s) => (nextSession = s))
				.catch(() => {
					// offline: the game falls back to a local seed, without leaderboard
				});
		};

		const stars = Array.from({ length: 45 }, () => ({
			x: Math.random() * W,
			y: Math.random() * H,
			s: Math.random() < 0.2 ? 2 : 1
		}));

		const start = () => {
			session = nextSession;
			sim = createSim(session ? session.seed : (Math.random() * 2 ** 32) | 0);
			inputs = [];
			lastInput = 0;
			acc = 0;
			sparks = [];
			run = null;
			message = '';
			status = 'playing';
			prefetch();
		};

		const gameOver = () => {
			status = 'over';
			overAt = performance.now();
			if (sim.score > hi) {
				hi = sim.score;
				try {
					localStorage.setItem(HI_KEY, String(hi));
				} catch {
					// ignore
				}
			}
			if (session && sim.score > 0) run = { session, inputs, score: sim.score };
			else if (online && sim.score > 0) message = 'Leaderboard unreachable, score not saved';
		};

		// wait (briefly) for the session, so a quick start is still a verifiable run
		const requestStart = () => {
			if (starting) return;
			if (!online || nextSession || !pending) return start();
			starting = true;
			const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
			Promise.race([pending, timeout]).then(() => {
				starting = false;
				if (mounted) start();
			});
		};

		action = () => {
			if (status === 'ready') requestStart();
			else if (status === 'paused') status = 'playing';
			else if (status === 'over' && performance.now() - overAt > 500) requestStart();
		};

		const update = (dt: number) => {
			clock += dt;
			for (const s of sparks) s.t -= dt;
			sparks = sparks.filter((s) => s.t > 0);
			if (status !== 'playing') return;

			// fixed 60 Hz steps: what the leaderboard replays must match exactly
			acc += dt;
			while (acc >= DT && status === 'playing') {
				acc -= DT;
				const input =
					(keys.left ? LEFT : 0) | (keys.right ? RIGHT : 0) | (keys.fire || fireLatch ? FIRE : 0);
				fireLatch = false;
				if (input !== lastInput) {
					inputs.push([sim.tick, input]);
					lastInput = input;
				}
				step(sim, input);
				for (const k of sim.kills) sparks.push({ x: k.x, y: k.y, t: 0.2 });
				if (sim.over) gameOver();
			}
		};

		const pixel = (size: number) => `${size}px "Press Start 2P", monospace`;

		const centered = (text: string, y: number, size: number, color: string) => {
			ctx.font = pixel(size);
			ctx.fillStyle = color;
			ctx.textAlign = 'center';
			ctx.fillText(text, W / 2, y);
			ctx.textAlign = 'left';
		};

		const draw = () => {
			ctx.fillStyle = '#070b18';
			ctx.fillRect(0, 0, W, H);
			ctx.textBaseline = 'top';

			ctx.fillStyle = 'rgba(238, 241, 255, 0.35)';
			for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s);

			// HUD
			ctx.font = pixel(10);
			ctx.fillStyle = '#aab4d6';
			ctx.fillText('SCORE', 14, 14);
			ctx.fillText('HI', 190, 14);
			ctx.fillText('WAVE', 330, 14);
			ctx.fillStyle = '#ffd23f';
			ctx.fillText(String(sim.score).padStart(5, '0'), 14, 32);
			ctx.fillText(String(Math.max(hi, sim.score)).padStart(5, '0'), 190, 32);
			ctx.fillText(String(sim.wave).padStart(2, '0'), 330, 32);
			ctx.fillStyle = '#ff5d73';
			ctx.fillText('♥'.repeat(Math.max(sim.lives, 0)), 400, 32);
			ctx.fillStyle = 'rgba(238, 241, 255, 0.25)';
			ctx.fillRect(0, 56, W, 2);

			// bugs
			ctx.font = pixel(12);
			const wobble = Math.floor(clock * 2) % 2;
			for (const b of sim.bugs) {
				if (!b.alive) continue;
				ctx.fillStyle = ROWS[b.row].color;
				ctx.fillText(ROWS[b.row].glyph, b.x, b.y + ((b.col + wobble) % 2) * 2);
			}
			ctx.fillStyle = '#eef1ff';
			for (const s of sparks) ctx.fillText('**', s.x, s.y);

			// shots
			ctx.fillStyle = '#ffd23f';
			for (const s of sim.shots) ctx.fillRect(s.x, s.y, 3, 10);
			ctx.fillStyle = '#ff5d73';
			for (const b of sim.bombs) ctx.fillRect(b.x, b.y, 3, 10);

			// player (blinks while invulnerable)
			if (sim.invulnerable <= 0 || Math.floor(clock * 12) % 2 === 0) {
				ctx.fillStyle = '#eef1ff';
				ctx.fillRect(sim.px + 12, PLAYER_Y, 6, 4);
				ctx.fillRect(sim.px + 6, PLAYER_Y + 4, 18, 4);
				ctx.fillRect(sim.px, PLAYER_Y + 8, 30, 6);
			}
			ctx.fillStyle = 'rgba(238, 241, 255, 0.25)';
			ctx.fillRect(0, H - 18, W, 2);

			if (status !== 'playing') {
				ctx.fillStyle = 'rgba(7, 11, 24, 0.78)';
				ctx.fillRect(0, 58, W, H - 58);
				const blink = Math.floor(clock * 2) % 2 === 0;
				if (starting) {
					centered('CONNECTING...', 260, 12, '#5cc8ff');
				} else if (status === 'ready') {
					centered('BUG HUNT', 200, 26, '#ffd23f');
					centered('SHIP IT BEFORE THE BUGS DO', 250, 9, '#eef1ff');
					if (blink) centered('PRESS SPACE TO START', 320, 10, '#5cc8ff');
				} else if (status === 'paused') {
					centered('PAUSED', 230, 22, '#ffd23f');
					if (blink) centered('PRESS SPACE TO RESUME', 300, 10, '#5cc8ff');
				} else {
					centered('GAME OVER', 200, 24, '#ff5d73');
					centered(`SCORE ${String(sim.score).padStart(5, '0')}`, 255, 12, '#eef1ff');
					if (sim.score > 0 && sim.score >= hi) centered('NEW HI-SCORE!', 285, 10, '#ffd23f');
					if (blink) centered('PRESS SPACE TO RETRY', 340, 10, '#5cc8ff');
				}
			}
		};

		const typing = (e: KeyboardEvent) => (e.target as HTMLElement | null)?.tagName === 'INPUT';

		const onKeyDown = (e: KeyboardEvent) => {
			const k = e.key;
			if (k === 'Escape') {
				close();
				return;
			}
			if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
			if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
			if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = true;
			else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = true;
			else if (k === ' ' || k === 'Enter') {
				if (status === 'playing') {
					if (k === ' ') keys.fire = fireLatch = true;
				} else if (!e.repeat) action();
			} else if ((k === 'p' || k === 'P') && !e.repeat) {
				if (status === 'playing') status = 'paused';
				else if (status === 'paused') status = 'playing';
			}
		};
		const onKeyUp = (e: KeyboardEvent) => {
			const k = e.key;
			if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
			else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
			else if (k === ' ') keys.fire = false;
		};
		const onBlur = () => {
			keys.left = keys.right = keys.fire = false;
			if (status === 'playing') status = 'paused';
		};

		prefetch();
		const unwatch = watchScores((scores) => (top = scores));

		let raf = 0;
		let last = performance.now();
		const loop = (now: number) => {
			update(Math.min((now - last) / 1000, 0.1));
			last = now;
			draw();
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('blur', onBlur);
		const overflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		dialog.focus();

		return () => {
			mounted = false;
			cancelAnimationFrame(raf);
			unwatch();
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', onBlur);
			document.body.style.overflow = overflow;
			document.documentElement.style.overflow = '';
		};
	});

	const hold = (key: 'left' | 'right' | 'fire', down: boolean) => (e: PointerEvent) => {
		e.preventDefault();
		keys[key] = down;
		if (down && key === 'fire') fireLatch = true;
		if (down && key === 'fire') action();
	};
</script>

<div class="overlay">
	<button class="overlay-backdrop" aria-label="Close game" onclick={close}></button>
	<div
		class="panel modal modal-game"
		role="dialog"
		aria-modal="true"
		aria-label="Bug Hunt game"
		tabindex="-1"
		bind:this={dialog}
	>
		<header class="panel-bar">
			<span class="panel-title">Bonus stage · Bug Hunt</span>
			<button class="panel-close" onclick={close} aria-label="Close game">Esc &#10005;</button>
		</header>
		<div class="game-layout">
			<div>
				<canvas bind:this={canvas} class="game" onpointerdown={() => action()}></canvas>
				<div class="pad">
					<button
						aria-label="Move left"
						onpointerdown={hold('left', true)}
						onpointerup={hold('left', false)}
						onpointerleave={hold('left', false)}
					>
						&#9664;
					</button>
					<button
						aria-label="Fire"
						class="pad-fire"
						onpointerdown={hold('fire', true)}
						onpointerup={hold('fire', false)}
						onpointerleave={hold('fire', false)}
					>
						Fire
					</button>
					<button
						aria-label="Move right"
						onpointerdown={hold('right', true)}
						onpointerup={hold('right', false)}
						onpointerleave={hold('right', false)}
					>
						&#9654;
					</button>
				</div>
				<p class="game-help">
					<kbd>&larr;</kbd> <kbd>&rarr;</kbd> move &nbsp; <kbd>Space</kbd> fire &nbsp; <kbd>P</kbd> pause
				</p>
			</div>

			<aside class="board">
				<p class="label">Hall of fame</p>
				{#if !online}
					<p class="board-note">Leaderboard offline.<br />Your hi-score stays in this browser.</p>
				{:else if top.length === 0}
					<p class="board-note">No records yet.<br />Be the first.</p>
				{:else}
					<ol class="board-list">
						{#each top as entry, i (i)}
							<li>
								<span class="board-rank">{String(i + 1).padStart(2, '0')}</span>
								<span class="board-name">{entry.name}</span>
								<span class="board-score">{String(entry.score).padStart(5, '0')}</span>
							</li>
						{/each}
					</ol>
				{/if}

				{#if run}
					<form class="board-form" onsubmit={save}>
						<label class="label" for="initials">Enter your initials</label>
						<div class="mt-2 flex gap-2">
							<input
								id="initials"
								class="field board-input"
								bind:value={name}
								maxlength="3"
								autocomplete="off"
								autocapitalize="characters"
								spellcheck="false"
								placeholder="AAA"
							/>
							<button class="btn-pixel btn-dock" disabled={saving}>
								{saving ? '...' : 'Save'}
							</button>
						</div>
					</form>
				{/if}
				{#if message}<p class="board-note" role="status">{message}</p>{/if}
				{#if online}
					<p class="board-proof">Scores are replayed and verified server-side.</p>
				{/if}
			</aside>
		</div>
	</div>
</div>
