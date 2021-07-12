import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
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
        nodeResolve(),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
            preventAssignment: true
        }),
        typescript({tsconfig: 'tsconfig.frontend.json'}),
    ]
}
