<script>
	// const compatData = require('@mdn/browser-compat-data/index');
	import compatData from '@mdn/browser-compat-data';

	export let topicName;
	export let mdnUrl;

	const wsUri = 'wss://us-nyc-1.piesocket.com/v3/1?api_key=unCNCLtR9PyKBXEDHxIduNmMrK1Vtr447QQCkU3A&notify_self';
	const websocket = new WebSocket(wsUri);

	websocket.onopen = console.info;
	websocket.onclose = console.info;
	websocket.onmessage = (e) => {
		topicName = '';
		mdnUrl = '';

		window.setTimeout(() => {
			({topicName, mdnUrl} = JSON.parse(e.data));
		}, 50);
	};
	websocket.onerror = console.error;

	function nextTopic() {
		const areas = [
			'css',
			'html',
			'api',
		];
		const randomArea = areas[Math.floor(Math.random() * areas.length)]
		const sections = Object.keys(compatData[randomArea]);
		const randomSection = sections[Math.floor(Math.random() * sections.length)];
		const topicNames = Object.keys(compatData[randomArea][randomSection]);
		const randomTopic = topicNames[Math.floor(Math.random() * topicNames.length)];

		try {
			const url = compatData[randomArea][randomSection][randomTopic].__compat.mdn_url;

			topicName = '';
			mdnUrl = '';

			websocket.send(JSON.stringify({
				topicName: `${randomArea.toUpperCase()} | ${randomSection} | ${randomTopic}`,
				mdnUrl: url,
			}));
		} catch (e) {
			nextTopic();
		}
	}
</script>

<div class="wrapper">
	<header>
		<img src="icon.png" width="101" height="101" alt="Working Draft Logo">
	</header>

	<main>
		<h1>Das Working Draft Webtechnologie Glücksrad</h1>
		<div aria-live="assertive">
		{#if topicName}
			<p><a href="{mdnUrl}" target="_blank">{topicName}</a></p>
		{/if}
		</div>
		<button on:click={nextTopic}>Zufallsgenerator aktivieren!</button>
	</main>
</div>

<style>
	/* The typing effect */
	@keyframes typing {
		from { max-width: 0 }
		to { max-width: 100% }
	}

	/* The typewriter cursor effect */
	@keyframes blink-caret {
		from, to { border-color: transparent }
		50% { border-color: currentColor; }
	}

	.wrapper {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
	}

	header,
	main {
		margin: 0 auto;
		padding: 1em;
		text-align: center;
	}

	h1 {
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}

	[aria-live="assertive"] {
		height: 3em;
	}

	p {
		width: max-content;
		overflow: hidden; /* Ensures the content is not revealed until the animation */
		margin: 0 auto 1em auto; /* Gives that scrolling effect as the typing happens */
		padding-right: 0.15em;
		border-right: .15em solid transparent; /* The typwriter cursor */
		font-weight: 600;
		white-space: nowrap; /* Keeps the content on a single line */
		animation: typing 3.5s steps(40, end), blink-caret .75s step-end 4;
	}
</style>
