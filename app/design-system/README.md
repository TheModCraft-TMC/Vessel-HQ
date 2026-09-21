# Design system

This directory owns Vessel HQ tokens and shared UI primitives. It must remain independent of application domains, layouts, and legacy code. Existing components under `app/react/components` are transitional candidates, not automatically part of the design system.

Promote a component here only after its API, accessibility, responsive behavior, theming, and cross-feature use are verified. Export promoted components through this directory's public API.
