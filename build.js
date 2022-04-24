const esbuild = require('esbuild');

// Build frontend JS bundle
esbuild.build({
    entryPoints: ['src/frontend/index.tsx'],
    outfile: 'built/js/bundle.js',
    bundle: true,
    target: 'chrome91',
}).then(() => console.log('-- Finished frontend bundle build\n')).catch(() => process.exit(1));

// Compile backend (main process and preload) TS to JS
esbuild.build({
    entryPoints: [
        'src/backend/main.ts',
        'src/backend/preload.ts',
        'src/backend/apis/dbapi.ts',
        'src/backend/apis/fileapi.ts',
        'src/backend/apis/volumeapi.ts',
    ],
    outdir: 'built/js/backend',
    platform: 'node',
    format: 'cjs',
    target: 'node14',
}).then(() => console.log('-- Finished backend build\n')).catch(() => process.exit(1));
