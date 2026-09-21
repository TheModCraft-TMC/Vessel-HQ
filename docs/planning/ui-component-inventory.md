# UI component inventory

Status: repository inventory completed September 21, 2026; external package selection remains open.

This inventory is the input to Vessel HQ token and component decisions. Counts describe the current tree and are not quality scores.

## Existing surface

| Area                         | Current source files | Notes                                                                                 |
| ---------------------------- | -------------------: | ------------------------------------------------------------------------------------- |
| `app/react/components`       |                  454 | Broad shared catalog accumulated before the domain-slice architecture                 |
| `components/primitives`      |                    9 | Card, status dot, and tabs are the smallest existing primitive set                    |
| `components/buttons`         |                   22 | Button variants, groups, loading, copy, add, delete, and menu actions                 |
| `components/form-components` |                   96 | Inputs, selects, validation, file controls, switches, sliders, and composed fieldsets |
| `components/datatables`      |                   59 | Table structure, columns, filters, pagination, selection, and responsive concerns     |
| Docker containers domain     |                  218 | First planned vertical-slice reference implementation                                 |

The shared component tree includes 70 Storybook stories and 63 component tests. There are 34 plain or CSS-module stylesheets, so token adoption must support CSS variables and Tailwind during the transition rather than assuming one styling mechanism.

## Existing foundations

- Typography uses the bundled variable Inter font.
- Tailwind 3.3.3 is present with preflight disabled.
- `app/assets/css/colors.json` exposes 31 named color families, while older CSS also relies on semantic custom properties such as `--bg-body-color` and `--text-body-color`.
- Light, dark, and high-contrast selectors already exist.
- Lucide supplies icons; TanStack Table supplies table behavior; React Query owns remote state.
- Radix Dialog and Slot are present, while several older overlays and selectors use Reach UI, React Select, or local implementations.
- Class Variance Authority and `clsx` are available for typed variants and class composition.

## Adoption candidates

| Candidate                          | Initial disposition                                                                      | Validation needed                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing button and form APIs      | Wrap and normalize before visual replacement                                             | Focus behavior, disabled/loading semantics, 44 px touch targets, error association, bundle duplication                                                                     |
| Radix primitives already installed | Prefer for new accessible interaction primitives where they fit                          | SSR/hydration, theming, keyboard behavior, high contrast                                                                                                                   |
| Existing datatable stack           | Retain behavior, introduce a narrow responsive adapter                                   | Card/list fallback, horizontal overflow, selection and bulk actions on touch                                                                                               |
| Existing Card, StatusDot, and Tabs | Evaluate first for promotion into `app/ui/components`                                    | API stability, semantic markup, reduced motion, responsive behavior                                                                                                        |
| `@themodcraft` packages            | No package is currently present in `package.json` or the lockfile; selection is deferred | Exact package and version, public or registry access, React 19, TypeScript, SSR, accessibility, responsive behavior, bundle impact, maintenance, license, Next.js coupling |

No `@themodcraft` package should be added by name inference. Once exact package names are supplied or published, record the reviewed version and disposition in this table before adoption.

## Token foundation

`app/ui/tokens/tokens.css` is the accepted destination for semantic compatibility tokens covering color, typography, spacing, radius, elevation, breakpoints, motion, focus, and touch targets. The initial implementation used the superseded `app/design-system/tokens.css` checkpoint. The values map onto current theme variables, so adopting the names does not silently restyle existing views. TypeScript breakpoint and interaction constants keep responsive behavior aligned with CSS.

The next design decision is the final Vessel HQ visual language. After that decision, change the semantic token values rather than restyling domain views independently.
