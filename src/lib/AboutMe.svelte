<script lang="ts">
	import Window from './Window.svelte';

	let { title }: { title: string } = $props();
</script>

<Window id="philosophy" title="Stage 4 · Lore" path="~/about.md">
	<h2 class="pixel text-2xl leading-snug uppercase md:text-4xl md:leading-snug">{title}</h2>
	<p class="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">
		I <b>love</b> learning — and I'm fully aware that the more I know, the more I realize I don't. (<a
			href="https://en.wikipedia.org/wiki/I_know_that_I_know_nothing"
		>
			I know that I know nothing
		</a>)<br />
		Computer science has been my biggest obsession since day one. I started as a Linux sysadmin
		<i>(GNU/Linux since 2007, open source forever)</i>, configuring servers and networks until I
		fell into security — CTFs, web vulnerabilities, the usual rabbit hole. I even have a Hackthebox
		profile if you want to add me.<br />
		<br />
		From there I moved into web development at a corporate environment — legacy stack, Java, .NET, Angular
		— where I worked with seriously experienced people and learned a lot about software design.<br
		/>
		After that I joined a startup, became CTO in under a year, got some shares, and learned a completely
		different set of lessons about money, people, and how companies actually work. We shipped 20+ projects
		across apps, SaaS, e-commerce, automations — basically everything.<br />
		<br />
		Then I joined a smart consulting company, worked as a software engineer and team leader, had a lot
		of fun, and shipped a lot of backend across enterprise-scale projects for some of the largest companies
		in Europe.<br />
		<br />
		Since the beginning of 2023 I'm Tech Lead at
		<a class="link" href="https://www.giunti.it/">Giunti Editore</a>, one of Italy's largest
		publishing groups. I manage a team of engineers and split my time between security,
		infrastructure and R&amp;D: we are replacing legacy software, one piece at a time, with
		platforms we build in-house and that unify data across the whole group. We mostly write Go,
		Python and Next.js, on top of a single shared UI framework. Book publishing is a surprisingly
		interesting world.<br />
		<br />
		During all these years I have done a lot of consultancy, to the most diverse companies, with many
		languages and software architectures.<br />
		I enjoy writing software, I do it for 80% of my time. The remaining 20% I like to use it to talk to
		interesting people, <a class="link" href="#contact">click here</a> if you are one of them.
	</p>
</Window>
