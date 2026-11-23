<script lang="ts">
	import Window from './Window.svelte';
</script>

<Window id="contact" title="Final stage · Send message" path="~/contact">
	<h2 class="pixel text-2xl leading-snug uppercase md:text-4xl md:leading-snug">
		Contact me &#9997;
	</h2>
	<div class="mt-8 grid gap-10 md:grid-cols-2">
		<form action="https://formspree.io/f/xlezabwo" method="POST" class="space-y-6">
			<label class="block">
				<span class="label">From</span>
				<input type="email" name="email" placeholder="you@example.com" required class="field" />
			</label>
			<label class="block">
				<span class="label">Message</span>
				<textarea placeholder="What's on your mind?" rows="5" name="message" required class="field"
				></textarea>
			</label>
			<button type="submit" class="btn-pixel btn-pixel-solid">
				<span>&#9654; Send request</span>
			</button>
		</form>
		<div class="md:pt-8">
			<p class="mb-8 text-2xl font-bold uppercase">
				"Software is like sex: it's better when it's free"
			</p>
			<a href="https://github.com/jacopobonomi/jacopobonomi.github.io" class="link">
				This website on Github<i class="fab fa-github pl-2"></i>
			</a>
			<p class="mt-8">
				<a href="mailto:jacopobonomi@protonmail.com" class="link">jacopobonomi@protonmail.com</a>
			</p>
		</div>
	</div>
</Window>
