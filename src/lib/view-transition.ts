// Cross-fade for whole-page visual switches (theme, language). Falls back to an instant switch
// where the View Transitions API is missing, the tab is hidden or the visitor prefers reduced motion.
type ViewTransition = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };

export function withViewTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => ViewTransition };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce || doc.visibilityState !== 'visible') return update();
  const transition = doc.startViewTransition(update);
  // An aborted animation (e.g. the tab gets hidden) still applies the update; nothing to report.
  const ignore = () => {};
  transition.ready.catch(ignore);
  transition.finished.catch(ignore);
  transition.updateCallbackDone.catch(ignore);
}
