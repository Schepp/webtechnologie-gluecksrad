import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import livereload from 'rollup-plugin-livereload';
import css from 'rollup-plugin-css-only';

import frontmatter from 'front-matter';

const production = !process.env.ROLLUP_WATCH;

const getDirectories = async source =>
    (await fs.readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

function generateMDNJson() {
    return {
        name: 'generate-mdn-json',

        async buildStart() {
            const data = {};

            const sections = {
                A11Y: {
                    Attributes: 'accessibility/aria/reference/attributes',
                    Roles: 'accessibility/aria/reference/roles',
                },
                APIs: 'api',
                ':CSS': {
                    'at-Rules': 'css/reference/at-rules',
                    Properties: 'css/reference/properties',
                    Selectors: 'css/reference/selectors',
                },
                '<HTML>': {
                    Attributes: 'html/reference/attributes',
                    Elements: 'html/reference/elements',
                    'Global Attributes': 'html/reference/global_attributes',
                },
                'JavaScript()': 'javascript/reference',
                '<SVG>': {
                    Attributes: 'svg/reference/attribute',
                    Elements: 'svg/reference/element',
                },
            }

            const results = await Promise.all(Object.keys(sections).map((section) => {
                switch (typeof sections[section]) {
                    default:
                    case 'string':
                        return getDirectories(`node_modules/@mdn/content/files/en-us/web/${sections[section]}`)
                            .then((dirs) => {
                                return Promise.all(dirs.map((dir) => {
                                    const file = `node_modules/@mdn/content/files/en-us/web/${sections[section]}/${dir}/index.md`;
                                    return fs.readFile(file, { encoding: 'utf8' })
                                        .then(result => {
                                            try {
                                                const content = frontmatter(result);
                                                return {
                                                    section,
                                                    title: content.attributes.title,
                                                    url: `https://developer.mozilla.org/en-US/docs/${content.attributes.slug}`
                                                }
                                            } catch(e) {
                                                // console.log(e);
                                                console.log(file);
                                                console.log(result);
                                                process.exit();
                                            }
                                        })
                                        .catch(console.log);
                                }));
                            });

                    case 'object':
                        return Promise.all(Object.keys(sections[section]).map((subsection) => {
                            return getDirectories(`node_modules/@mdn/content/files/en-us/web/${sections[section][subsection]}`)
                                .then((dirs) => {
                                    return Promise.all(dirs.map((dir) => {
                                        const file = `node_modules/@mdn/content/files/en-us/web/${sections[section][subsection]}/${dir}/index.md`;
                                        return fs.readFile(file, { encoding: 'utf8' })
                                            .then(result => {
                                                try {
                                                    const content = frontmatter(result);
                                                    return {
                                                        section,
                                                        title: content.attributes.title,
                                                        url: `https://developer.mozilla.org/en-US/docs/${content.attributes.slug}`
                                                    }
                                                } catch (e) {
                                                    // console.log(e);
                                                    console.log(file);
                                                    console.log(result);
                                                    process.exit();
                                                }
                                            })
                                            .catch(console.log);
                                    }));
                                });
                        })).then((results) => {
                            return results.flat();
                        });
                }
            }));
            const flattenedResults = results.flat();

            flattenedResults.forEach((result) => {
                const section = result.section;
                data[section] = data[section] || {};
                data[section][result.title] = result.url;
            });

            await fs.writeFile(
                'src/mdn-data.json',
                JSON.stringify(data, null, 2)
            );
        },
    };
}

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
        generateMDNJson(),
        
		svelte({
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'bundle.css' }),

		json({
			compact: true
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
