/**
 * Release placeholder for `dev-assets/`.
 *
 * Metro resolves every static require it can see, including the ones inside the
 * `__DEV__`-gated model screens, so a release bundle would otherwise carry the
 * Model V1 QA fixture JPEGs. `metro.config.js` rewrites resolutions under
 * `dev-assets/` to this module in release builds. An asset module id is a
 * number, and these screens never mount outside development.
 */
module.exports = 0;
