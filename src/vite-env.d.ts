/// <reference types="vite/client" />

declare module 'virtual:content' {
  // Typed as ContentBundle in src/lib/content.ts
  const content: unknown;
  export default content;
}

declare module 'virtual:translations/*' {
  // content/i18n/<lang>.json: English text → translation (loaded only when that language is picked)
  const dict: Record<string, string>;
  export default dict;
}

declare const __HAS_RAPTOR__: boolean;

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_USE_EMULATORS?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
}
