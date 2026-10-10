const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** True when the Firebase web config is present (otherwise feed/admin/contact show a notice). */
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const useEmulators = env.VITE_USE_EMULATORS === 'true';
export const cloudinaryCloudName = env.VITE_CLOUDINARY_CLOUD_NAME ?? '';
