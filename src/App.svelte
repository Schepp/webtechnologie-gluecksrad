<script>
	import compatData from '@mdn/browser-compat-data';

	console.log({ compatData });

	export let topics = [];
	export let name;
	export let url;

	export let availableAreasMap = {
		'css': ':CSS',
		'html': '<HTML>',
		'svg': '<SVG>',
		'javascript': 'JavaScript()',
		'api': 'APIs',
		'a11y': 'A11Y',
	};
	export let availableAreas = Object.keys(availableAreasMap);
	export let selectedAreas = availableAreas.map(() => true);

	const wsUri = 'wss://s7773.nyc3.piesocket.com/v3/1?api_key=OfAcGdq74C0lkU6EVppABXqj5voOUNJKel2n2WH5&notify_self';
	const websocket = new WebSocket(wsUri);

	const newEntry = (data) => {
		if (name) {
			topics = topics = [{
				name,
				url,
			}, ...topics];
		}

		name = '';
		url = '';

		window.setTimeout(() => {
			({name, url} = data);
		}, 50);
	};

	websocket.onopen = console.info;
	websocket.onclose = console.info;
	websocket.onmessage = (e) => {
		newEntry(JSON.parse(e.data));
	};
	websocket.onerror = console.error;

	function randomlyDrillDownCompatDataUntilTopic(item, path = []) {
		if (item.__compat) {
			return {
				path,
				randomTopic: item,
			};
		}

		const filteredSectionNames = Object.keys(item).filter(section => section !== 'manifest');
		const randomIndex = Math.floor(Math.random() * filteredSectionNames.length);
		const sectionName = filteredSectionNames[randomIndex];
		const section = item[sectionName];

		path.push(sectionName)

		return randomlyDrillDownCompatDataUntilTopic(section, path);
	}

	function nextTopic() {
		const areas = availableAreas.filter((area, index) => selectedAreas[index]);

		if (!areas.length) {
			return;
		}

		const randomArea = areas[Math.floor(Math.random() * areas.length)];

		const findKeyInCompatData = (tree, key, path = []) => {
			return Object
				.keys(tree)
				.reduce((path, treeKey) => {
					if (JSON.stringify(tree[treeKey]).indexOf(`"${key}"`) > -1) {
						path.push(treeKey);

						if (treeKey !== key) {
							path = findKeyInCompatData(tree[treeKey], key, path);
						}
					}

					return path;
				}, path);
		};

		console.log({ randomArea, compatData });

		let randomTopic, path;

		switch (true) {
			default:
				({ randomTopic, path } = randomlyDrillDownCompatDataUntilTopic(compatData[randomArea]));
				break;

			case randomArea === 'a11y': {
				const subpath = compatData.api.Element;

				console.log({ subpath });

				const filteredAttributeNames = Object
							.keys(subpath)
							.filter((name) => (name === 'role' || name.startsWith('aria')));
				const randomIndex = Math.floor(Math.random() * filteredAttributeNames.length);
				const randomAttribute = filteredAttributeNames[randomIndex];

				randomTopic = subpath[randomAttribute];
				path = [randomAttribute]; // ['compatData', 'api', 'Element', 'ElementInternals']
				}
				break;
		}

		const url = randomTopic.__compat.mdn_url || randomTopic.__compat.spec_url;

		if (!url || topics.find((topic) => topic.url === url)) {
			nextTopic();
			return;
		}

		console.log({ randomTopic, path });

		const data = {
			name: `${availableAreasMap[randomArea]} | ${path.join(' | ')}`,
			url,
		};

		// newEntry(data);

		websocket.send(JSON.stringify(data));
	}
</script>

<div class="wrapper">
	<header>
		<img src="icon.png" width="101" height="101" alt="Working Draft Logo">
	</header>

	<main>
		<h1>Das Working Draft Webtechnologie Glücksrad</h1>
		<div role="group" aria-label="Themenbereiche aktivieren oder deaktivieren" class="checkboxes">
		{#each availableAreas as area, index}
			<label class="checkbox"><input type="checkbox" value={area} bind:checked={selectedAreas[index]}> {availableAreasMap[area]}</label>
		{/each}
		</div>
		<div aria-live="assertive">
		{#if name}
			<p><a href="{url}" target="_blank">{name}</a></p>
		{/if}
		</div>
		<button on:click={nextTopic}>Zufallsgenerator aktivieren!</button>
		<ul class="past-topics" aria-label="Vorherige Themen">
		{#each topics as topic}
			<li><a href="{topic.url}" target="_blank">{topic.name}</a></li>
		{/each}
		</ul>
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

	/* The list effect */
	@keyframes listEven {
		from {
			max-height: 0;
			opacity: 0;
		}
		to {
			max-height: 2em;
			opacity: 1;
		}
	}

	/* The list effect */
	@keyframes listOdd {
		from {
			max-height: 0;
			opacity: 0;
		}
		to {
			max-height: 2em;
			opacity: 1;
		}
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

	.past-topics {
		list-style: none;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: block;
		margin: 0;
		padding: 1em 0;
	}

	.past-topics li {
		overflow: hidden;
		margin: 0 0 0.25em 0;
		padding: 0;
		white-space: nowrap;
	}

	.past-topics a {
		color: #999;
	}

	.past-topics li:first-child:nth-last-child(even) {
		animation: listEven 600ms;
	}

	.past-topics li:first-child:nth-last-child(odd) {
		animation: listOdd 600ms;
	}

	.checkboxes {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
		justify-content: center;
		margin: 1em auto;
	}

	.checkbox {
		accent-color: #8f098f;
		display: inline-block;
	}
</style>
