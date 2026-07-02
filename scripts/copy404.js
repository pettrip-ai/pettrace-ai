import { copyFileSync } from 'fs';
import { resolve } from 'path';

const distDir = resolve(process.cwd(), 'dist');
copyFileSync(resolve(distDir, 'index.html'), resolve(distDir, '404.html'));
console.log('404.html created successfully');
