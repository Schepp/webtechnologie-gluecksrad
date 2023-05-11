import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		topics: [],
		name: '',
		url: '',
	}
});

export default app;
