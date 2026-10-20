# Full-screen shop map design

The owner rejected the previous map workspace because standard page chrome and BottomNav consumed the viewport and the composition felt unfinished. `/shops` is now a dedicated fixed viewport canvas. It does not mount AppShell or BottomNav. Root header/banner/footer are wrapped in `data-site-chrome`; route-scoped CSS hides those wrappers only while `.shop-map-page` exists. Navigating away must restore the ordinary chrome and page scrolling. Do not hide navigation globally or modify shared component internals.

Desktop: full-bleed map under independent search/results floating panels, compact brand/theme controls, explicit map-area search. Mobile: compact search overlay, docked draggable result panel, no bottom tabs; back-to-browse remains available. Selected detail replaces the result list instead of duplicating the same business below it. Public approximate coordinates, verified-only projection and bounds-search behavior are unchanged. Root layout wrappers use display:contents on ordinary routes.

## Temporary artwork

Asset: `public/images/shop-concept-ai.png` (1536×1024 PNG). Generated with built-in image_gen on 20 October 2026, not the API/CLI fallback. It is a fictional showroom concept, never evidence of a particular provider. Detail has an explicit “ภาพประกอบ AI · ไม่ใช่ภาพร้านจริง” label; thumbnails say “ภาพ AI”. It is a shared placeholder until real provider imagery has an explicit upload/data contract. Do not invent real photos, ratings, hours or addresses.

Final generation prompt:

> Create a premium editorial architectural illustration for a Thai spirit-house service marketplace, landscape 3:2. A fictional small open-air artisan showroom in Thailand, carefully arranged traditional spirit houses on plinths, pale plaster architecture, terracotta doorway arch, a leafy courtyard and warm natural daylight. Beautiful sophisticated tactile flat illustration with clean geometry, warm ivory, stone beige, charcoal and a restrained vermilion accent, subtle natural material texture. Calm composition, no people, no lettering, no logos, no claims of a real business, not a UI mockup. This is explicitly a fictional AI placeholder artwork for a shop detail card.

## Required QA

Verify the canvas rectangle equals the actual desktop/mobile viewport, not a max-width shell. Check no document overflow or BottomNav, readable OSM attribution, search/type/area reset, marker/list selection, close detail, drag/toggle sheet, both themes and exit to browse restoring standard chrome. Use actual screenshot review as well as geometry. Record release-specific evidence in DEPLOYMENT-STATUS.md. A native phone/browser matrix remains separate from desktop emulation.
