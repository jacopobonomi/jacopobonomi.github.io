<script lang="ts">
	import Contact from '#lib/Contact.svelte';
	import Footer from '#lib/Footer.svelte';
	import WorkExperience from '#lib/WorkExperience.svelte';
	import AboutMe from '#lib/AboutMe.svelte';
	import Arcade from '#lib/Arcade.svelte';
	import Background from '#lib/Background.svelte';
	import Projects from '#lib/Projects.svelte';
	import Welcome from '#lib/Welcome.svelte';
	import 'animate.css';
	import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
	import '@fortawesome/fontawesome-free/css/brands.min.css';
	import '../styles/index.css';
</script>

<svelte:head>
	<title>Jacopo Bonomi - Website</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta
		name="description"
		content="Jacopo Bonomi website, full stack developer, AWS Cloud architect, computer science enthusiast, entrepreneur and critical thinker"
	/>
</svelte:head>
<Background />
<main
	class="relative z-10 mx-auto max-w-6xl space-y-10 px-3 py-6 text-white md:space-y-16 md:px-8 md:py-16"
>
	<Welcome />
	<WorkExperience />
	<Projects />
	<AboutMe title="About me" />
	<Contact />
	<Footer />
</main>
<Arcade />
