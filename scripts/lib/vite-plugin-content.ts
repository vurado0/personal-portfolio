// Exposes /content as `virtual:content` (a ContentBundle) and reloads the page when content changes.
import path from 'node:path';
import type { Plugin } from 'vite';
import { loadContent } from './content.ts';

const ID = 'virtual:content';
const RESOLVED = '\0' + ID;
// German/Japanese dictionaries are separate chunks: English visitors never download them.
const TR_ID = 'virtual:translations/';
const TR_RESOLVED = '\0' + TR_ID;

export function contentPlugin(root: string): Plugin {
  let includeDrafts = true;
  const contentDir = path.join(root, 'content');
  return {
    name: 'portfolio-content',
    configResolved(config) {
      includeDrafts = config.command === 'serve';
    },
    resolveId(id) {
      if (id === ID) return RESOLVED;
      if (id.startsWith(TR_ID)) return TR_RESOLVED + id.slice(TR_ID.length);
      return undefined;
    },
    load(id) {
      if (id.startsWith(TR_RESOLVED)) {
        const lang = id.slice(TR_RESOLVED.length) as 'de' | 'ja';
        return `export default ${JSON.stringify(loadContent({ root, includeDrafts }).bundle.translations[lang] ?? {})};`;
      }
      if (id !== RESOLVED) return;
      const { bundle, issues } = loadContent({ root, includeDrafts });
      for (const i of issues) this.warn(`${i.file}: ${i.message}`);
      return `export default ${JSON.stringify({ ...bundle, translations: { de: {}, ja: {} } })};`;
    },
    configureServer(server) {
      server.watcher.add(contentDir);
      const onChange = (file: string) => {
        if (!file.startsWith(contentDir)) return;
        for (const m of server.moduleGraph.idToModuleMap.values())
          if (m.id === RESOLVED || m.id?.startsWith(TR_RESOLVED)) server.moduleGraph.invalidateModule(m);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
