// Bundles assets3d.ts (+ vendored Studio code + three.js) into one IIFE for the page.
import * as esbuild from '/Users/cece/Documents/minest/downloaded-octopus/node_modules/esbuild/lib/main.js';
const r = await esbuild.build({ entryPoints: [new URL('./assets3d.ts', import.meta.url).pathname], bundle: true, minify: true, format: 'iife', target: ['es2019', 'safari14'],
  nodePaths: ['/Users/cece/Documents/minest/downloaded-octopus/node_modules'], outfile: new URL('./dist/assets3d.js', import.meta.url).pathname, legalComments: 'none', logLevel: 'warning', metafile: true });
const out = Object.values(r.metafile.outputs)[0];
console.log('bytes', out.bytes);
