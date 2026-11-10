import {build} from 'esbuild';
import {compile} from '@tailwindcss/node';
import {readFile,writeFile} from 'node:fs/promises';
import {globSync} from 'node:fs';
import path from 'node:path';
const base=path.dirname(new URL(import.meta.url).pathname);process.chdir(base);
const compiler=await compile(await readFile('src/index.css','utf8'),{base:path.join(base,'src'),onDependency:()=>{}});
const sources=globSync('src/**/*.{tsx,ts}');let candidates=new Set();for(const f of sources){const s=await readFile(f,'utf8');for(const token of s.match(/[^\s"'`<>]+/g)||[])candidates.add(token);}
await writeFile('src/compiled.css',compiler.build([...candidates]));
await build({entryPoints:['src/embed.tsx'],outfile:'minest-keyflow.js',bundle:true,minify:true,format:'iife',target:['safari16'],loader:{'.css':'text'},define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
