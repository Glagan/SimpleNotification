import { terser } from 'rollup-plugin-terser';

export default {
	input: 'src/SimpleNotification.js',
	output: {
		file: 'dist/SimpleNotification.min.js',
		format: 'es',
		sourcemap: true,
	},
	plugins: [terser({ keep_classnames: true, compress: true })],
};
