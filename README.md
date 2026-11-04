# AURELO — premium e-commerce front end (demo)

A complete, production-style multi-page storefront built with plain HTML, CSS
and JavaScript — no build step, no framework. Open it locally and everything
works: catalogue, filters, product pages, bag, checkout summary, search.

## Run locally

```bash
cd aurelo
python3 -m http.server 8000
# open http://localhost:8000
```

(Any static server works — `npx serve`, VS Code Live Server, etc.)

## File structure

```
aurelo/
├── index.html            Home: hero, categories, featured, spotlight, story/values, testimonials, newsletter
├── shop.html             Category listing: filter chips, search, price range, sorting, empty state
├── product.html          Product page (driven by ?id=): gallery, variants, qty, tabs, interactive rating summary, size-guide modal, related
├── cart.html             Bag view: quantity steppers, remove, free-shipping progress, summary
├── checkout.html         Checkout form + order summary + confirmation state
├── 404.html              Custom 404 with illustration
└── assets/
    ├── css/styles.css    The whole design system (tokens, type scale, components, breakpoints)
    ├── js/data.js        Product catalogue + reviews data (edit products here)
    ├── js/app.js         Shared engine: cart store (localStorage), drawer, search suggestions, countdown, loader, page initialisers
    └── img/
        ├── products/     aurelo-<slug>-01/02/03.svg — front / detail / back views (swap with real photos, same names)
        └── illustrations/ hero, category tiles, empty-bag, empty-search, not-found (custom SVG set)
```

## Brand assumptions (change freely)

- **Name:** AURELO — a premium minimalist clothing label ("fewer, better things").
- **Products:** wardrobe essentials — trench, knit, shirt, trousers, blazer, slip dress, tee, cardigan (8 SKUs, USD prices as placeholders).
- **Tone:** quiet, editorial, assured. Copy is written in that voice throughout (no lorem ipsum).
- **Type:** Fraunces (display serif — gives the editorial, studio-made feel generic
  templates lack) + Inter (neutral UI sans, legible at small sizes). One of the
  comparable pairings to the Poppins/Lato/Open Sans family, chosen deliberately.
- **Palette:** 3 core colours + neutrals — Forest `#24382E`, Clay `#B07D4F`,
  Ecru `#F7F3EC`, warm ink neutrals. All text/background pairs pass WCAG AA.
- **Icons:** Lucide via CDN (`data-lucide` attributes), one consistent stroke set. No emoji anywhere.

## Behaviour notes

- Cart is shared across all pages (localStorage key `aurelo_cart_v1`); the header
  badge, drawer, cart page and checkout all read the same store.
- Branded loader shows once per session. All animation uses one easing curve and
  is disabled under `prefers-reduced-motion`.
- Checkout is a front-end demo: submitting shows a confirmation state and clears
  the bag. Connect a payment provider at the marked form for production.
- Product images are consistent flat-illustration SVGs so the demo never shows a
  broken image; replace them with photography at the same paths when ready.
