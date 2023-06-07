import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const components = [
  'tab',
  'tab-panel',
  'tab-group',
  'dropdown',
  'menu',
  'menu-item',
  'checkbox',
  'divider',
  'menu-label',
  'option',
  'select',
  'tooltip',
  'textarea',
  'dialog',
  'card',
  'icon-button',
  'button',
  'icon',
  'alert',
  'input',
  'spinner',
  'avatar',
  'skeleton',
  'popup',
];
const exclude = components.map(
  c => `@shoelace-style/shoelace/dist/components/${c}/${c}.js`
);
export default defineConfig({
  optimizeDeps: {
    exclude: [
      ...exclude,
      '@holochain-open-dev/elements/dist/elements/display-error.js',
      '@holochain-open-dev/file-storage/dist/elements/upload-files.js',
    ],
  },
  plugins: [
    checker({
      typescript: true,
    }),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(
            __dirname,
            'node_modules/@shoelace-style/shoelace/dist/assets'
          ),
          dest: path.resolve(__dirname, 'dist/shoelace'),
        },
      ],
    }),
  ],
});
