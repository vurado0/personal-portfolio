// BrowserRouter whose basename is the language prefix of the URL: "/de/skills" renders the route
// "/skills", and every <Link to="/projects"> on a German page points to "/de/projects" by itself.
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Router, UNSAFE_createBrowserHistory as createBrowserHistory } from 'react-router';
import { followUrlLocale, localePrefix, localizedPath, registerLocaleNavigation, restoreSavedLocale, splitLocalePath } from '../i18n';

const history = createBrowserHistory({ v5Compat: true });

export function LocaleRouter({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ action: history.action, location: history.location });
  useLayoutEffect(() => history.listen(({ action, location }) => setState({ action, location })), []);
  const { locale } = splitLocalePath(state.location.pathname);

  useEffect(
    () =>
      registerLocaleNavigation((next, replace) => {
        const { pathname, search, hash } = history.location;
        const to = localizedPath(splitLocalePath(pathname).path, next) + search + hash;
        if (replace) history.replace(to);
        else history.push(to);
      }),
    [],
  );
  useEffect(() => followUrlLocale(locale), [locale]);
  useEffect(() => restoreSavedLocale(), []);

  return (
    <Router basename={localePrefix(locale) || '/'} location={state.location} navigationType={state.action} navigator={history}>
      {children}
    </Router>
  );
}
