import { keys } from 'lodash';
import json from '@rollup/plugin-json';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    external: [...keys(pkg.dependencies), ...keys(pkg.peerDependencies)],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        interop: false,
        esModule: false,
        preferConst: true,
        strict: true,
      },
      { file: pkg.module, format: 'es', preferConst: true },
    ],
    plugins: [json({ preferConst: true })],
  },
];
