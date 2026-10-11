// Route chunks that are loaded on demand, plus warm-up helpers: hovering or touching a "Login" link
// starts downloading the login page and Firebase, so the page is ready by the time the click lands.
import { getFirebase } from './firebase';

export const loadLogin = () => import('../pages/Login');
export const loadAdmin = () => import('../pages/Admin');

let warmed = false;
export function prefetchLogin() {
  if (warmed) return;
  warmed = true;
  loadLogin().catch(() => (warmed = false));
  getFirebase().catch(() => {});
}

/** Props for a link to /login: start loading on hover, keyboard focus or touch. */
export const loginPrefetchProps = { onMouseEnter: prefetchLogin, onFocus: prefetchLogin, onTouchStart: prefetchLogin };
