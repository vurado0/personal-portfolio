import { en, type MessageKey } from './en';

const messages: Record<string, Record<MessageKey, string>> = { en };
let locale = 'en';

export function setLocale(next: string) {
  if (messages[next]) locale = next;
}

/** Translate a UI string; `{name}` placeholders are replaced from `vars`. */
export function t(key: MessageKey, vars: Record<string, string> = {}): string {
  const template = messages[locale]?.[key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}
