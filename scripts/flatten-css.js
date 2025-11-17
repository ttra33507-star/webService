import fs from 'fs';
import path from 'path';
import postcss from 'postcss';

const assetsDir = path.resolve('dist', 'assets');
const cssFile = fs.readdirSync(assetsDir).find((file) => file.startsWith('index-') && file.endsWith('.css'));

if (!cssFile) {
  console.error('No built CSS file found in dist/assets (expected index-*.css).');
  process.exit(1);
}

const cssPath = path.join(assetsDir, cssFile);
const css = fs.readFileSync(cssPath, 'utf8');

const unwrapLayers = () => ({
  postcssPlugin: 'unwrap-layers',
  Once(root) {
    root.walkAtRules('layer', (rule) => {
      if (!rule.nodes || rule.nodes.length === 0) {
        rule.remove();
        return;
      }
      rule.replaceWith(...rule.nodes);
    });
  },
});
unwrapLayers.postcss = true;

const result = await postcss([unwrapLayers()]).process(css, {
  from: cssPath,
  to: cssPath,
});

fs.writeFileSync(cssPath, result.css);
console.log(`Flattened @layer blocks for legacy browsers in ${cssFile}`);
