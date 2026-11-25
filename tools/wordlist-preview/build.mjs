import * as esbuild from '/Users/cece/Documents/minest/downloaded-octopus/node_modules/esbuild/lib/main.js';
const base=new URL('.',import.meta.url);
await esbuild.build({entryPoints:[new URL('preview.js',base).pathname],bundle:true,minify:true,format:'iife',target:['es2019','safari15'],outfile:new URL('preview.min.js',base).pathname,legalComments:'none'});
