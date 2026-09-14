# Yandex Metrica

Counter: **112561962**. Shared implementation: `ui/metrika.js`.

- `index.html`: one initialization, `defer: true`, explicit `hit` for the initial route and subsequent chat/labs/documentation changes, including back/forward.
- `privacy-policy.html`, `terms.html`: the same counter, one view per document.
- `labs.html`, `documentation.html`: no separate tag; these redirect into the shell or render in its iframe. Their views belong to the parent route.
- Initialization waits for the existing `n8n_consent=1` agreement. No noscript pixel: it would bypass that check. Previously accepted agreements remain accepted.
- Webvisor, clickmap, trackLinks and accurateTrackBounce enabled. Ecommerce omitted because the site has no purchases. No extra counters or custom goals are required for pageview reporting.
- Pageview URLs omit arbitrary query parameters and fragments, retaining only supported `page` values. Consecutive visits to the same normalized URL are deduplicated.
- Chat, Debug, configuration and inputs are masked using Yandex's `ym-hide-content` / `ym-disable-keys` classes. Do not remove these when adding UI components that show user data.

Build copies the loader with the existing `ui/*` workflow. No account settings or deployment are changed by this implementation. To verify after deployment: accept the agreement, navigate Chat → Labs → Documentation → Back, then use the counter's verification tool and reports. Ad blockers may block delivery. Local checks should intercept the tag request to avoid adding test traffic.

Documentation:
- https://yandex.ru/support/metrica/ru/code/counter-spa-setup
- https://yandex.ru/support/metrica/ru/code/counter-initialize
- https://yandex.ru/support/metrica/ru/webvisor/settings
