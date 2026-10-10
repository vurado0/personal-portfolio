// Exposes /content as `virtual:content` (a ContentBundle) and reloads the page when content changes.
import path from 'node:path';
import type { Plugin } from 'vite';
import { loadContent } from './content.ts';

const ID = 'virtual:content';
const RESOLVED = '\0' + ID;

export function contentPlugin(root: string): Plugin {
  let includeDrafts = true;
  const contentDir = path.join(root, 'content');
  return {
    name: 'portfolio-content',
    configResolved(config) {
      includeDrafts = config.command === 'serve';
    },
    resolveId(id) {
      return id === ID ? RESOLVED : undefined;
    },
    load(id) {
      if (id !== RESOLVED) return;
      const { bundle, issues } = loadContent({ root, includeDrafts });
      for (const i of issues) this.warn(`${i.file}: ${i.message}`);
      return `export default ${JSON.stringify(bundle)};`;
    },
    configureServer(server) {
      server.watcher.add(contentDir);
      const onChange = (file: string) => {
        if (!file.startsWith(contentDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
