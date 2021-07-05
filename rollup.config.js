import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/frontend/index.tsx',
    output: {
        file: 'dist/js/bundle.js',
        format: 'iife'
    },
    plugins: [
        commonjs(),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
            preventAssignment: true
        }),
        typescript(),
    ]
}
