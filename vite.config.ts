import {defineConfig} from 'vite';
// Dictionaries use default-only imports. Avoid generating thousands of named
// exports/AST nodes for their entries; lazy chunks still load per language/length.
export default defineConfig({json:{namedExports:false,stringify:true}});
