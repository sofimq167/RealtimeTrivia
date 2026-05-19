// Le digo a TypeScript que los archivos .css son módulos válidos para importar.
// Next.js los maneja nativamente en build time, pero el language server del IDE
// no lo sabe por defecto y marca el import como error.
declare module '*.css';