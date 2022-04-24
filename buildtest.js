const esbuild = require('esbuild');

// Build test bundle
esbuild.build({
    entryPoints: ['src/test/test.ts'],
    outfile: 'built/js/testbundle.js',
    external: ['better-sqlite3'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node14',
}).then(() => console.log('-- Finished test bundle build\n')).catch(() => process.exit(1));
