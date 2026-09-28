import { router } from 'expo-router';

/** Bottom-tab destinations that live inside the root stack's `(tabs)` screen. */
export type TabHref = '/home' | '/scan' | '/activity' | '/today';

/**
 * Leave a root-level screen (report, scan, record or preview flow) for a
 * bottom-tab route.
 *
 * `/home`, `/scan`, `/activity` and `/today` all resolve to the root stack's
 * single `(tabs)` screen, so returning to a tab must reuse that entry.
 * `router.replace` instead swaps the current screen for a second, brand-new
 * `(tabs)` route: the root stack then holds two `(tabs)` screens, back
 * navigation from the new one returns to the stale one, and the leftover at
 * the bottom can never be popped because a stack cannot pop its first route.
 * Any native removal of that leftover screen is then reported as "The screen
 * '(tabs)' was removed natively but didn't get removed from JS state".
 *
 * `router.dismissTo` pops back to the existing `(tabs)` entry and focuses the
 * requested tab, keeping the root stack's native and JS state in agreement.
 *
 * Call this only from screens outside `(tabs)`. Inside a tab route the same
 * href resolves within the tab navigator, where `dismissTo` is a no-op.
 */
export function returnToTab(href: TabHref) {
  router.dismissTo(href);
}
