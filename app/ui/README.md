# Shared UI

This directory owns Vessel HQ tokens, layouts, and shared UI primitives. It must remain independent of application domains, providers, and legacy code. Existing components under `app/react/components` are transitional candidates, not automatically shared UI.

Promote a component here only after its API, accessibility, responsive behavior, theming, and cross-domain use are verified. Export promoted components through this directory's public API.
