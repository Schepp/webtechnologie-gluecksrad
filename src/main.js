import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		topicName: '',
		mdnUrl: '',
	}
});

export default app;
