<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Saan — implementation guide

Saan is a Thai-language web app: a marketplace for spirit-house (ศาลพระภูมิ) services. Product plan: `docs/PLAN.md`.
All user-facing text is Thai. Code, identifiers and comments may be English or Thai.

## Stack and traps

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4. `cacheComponents` is OFF: every page reads live data.
- `params` and `searchParams` are Promises. Type pages as `PageProps<"/route/[id]">` and `await` them.
- UI library: shadcn/ui on **Base UI** (not Radix). There is NO `asChild`. Read a component's file in `src/components/ui/` before using it.
  - A button that navigates: use `LinkButton` from `@/components/link-button`, never `<Button>` wrapping `<Link>`.
  - `Button` sizes are small by default. Use `size="xl"` for every primary and secondary action.
  - Choosing one of a few options: use large tappable option cards (`<button type="button" aria-pressed>`), not `Select`.
  - Dates: `<ThaiDateField>` (พ.ศ. display, posts yyyy-mm-dd). Date+time: `<ThaiDateTimeField>`. Never native date inputs (v6 rule 14).
- Icons: `lucide-react` only. No emoji anywhere.
- Toasts: `import { toast } from "sonner"`.

## Design direction (v5 "Flat Minimal + Modern" + v6 "Declutter & identity" — from the product owner, follow strictly)

The brief: **Minimal + Modern**, light and dark mode, easy for elderly users, never text-only. The look is flat: white ground, black text, one vivid vermilion accent, 1px warm borders instead of shadows, pill-shaped controls, big headings in REGULAR weight, quiet UI chrome so content (and later real photography) carries the page. Style reference given by the owner: a flat travel-deals site (white, black, one red, thin beige/warm borders, pills). Take only the principles; never copy its logo, art, photos, copy or layouts.

History to respect (do not repeat these):
1. Early mock-ups: rejected as "not beautiful".
2. Brief: minimal, clean, modern, easy to use, friendly, never text-only.
3. v1 (white ground, 1px-bordered cards, teal, flat pastel squares): "like Android 9, too plain".
4. v2 (dark-green hero and nav in light mode): "not minimal". So in LIGHT mode never use large dark or saturated colour blocks.
5. v3 (grey ground, floating white cards, charcoal, gold): taken further.
6. v4 "Quiet Luxury" (ivory, serif headings, gold, soft shadows, glass dock): the owner then asked for flat Minimal + Modern, which is this v5. No serif, no shadows, no glows, no gradients, no gold.
7. v5 shipped and looked "too basic, and cluttered (รก)" next to international web apps: the same bundle (box + icon circle + red label + title + grey line) everywhere. v6 keeps the v5 tokens and removes the bundle, adds the arch identity, a richer illustration set and a few new primitives. See the v6 section below, which wins over any v5 text that contradicts it.

### v6 — Declutter & identity (READ THIS FIRST; it overrides any v5 text below that contradicts it)

Why: an independent review found tokens fine but components and composition templated: nearly every fact arrived as the same bundle "box + icon-in-a-circle + red label + title + grey line". v6 removes the bundle and adds one signature shape: the **lit doorway arch** of a spirit house (the vermilion arch in every drawing).

#### Rules (each replaces the older v5 behaviour)
1. **Eyebrow** (red label above a title): at most ONE per page, only on the page title (`PageHeader eyebrow`), only when it adds information (e.g. order number "SA-1042", "สวัสดี <ชื่อ>"). Never a category that repeats the title. `SectionTitle eyebrow` and `SidePanel eyebrow` are still accepted but render NOTHING. A requirement ("ต้องเลือกอย่างน้อย 1 วัน") goes under the field with `FieldHint`, never in red above a title. The numbered labels on home ("01 บริการ") are plain grey numbers, not eyebrows, and stay.
2. **IconTile (icon-in-a-circle)** only where a symbol speeds up recognition (a status, a channel, a contact method). NEVER on: option cards for province / budget / place, FAQ rows, settings rows, notification rows. When the row IS a shrine, order or service, use `ThumbArt` (a `KindArt`/`ServiceArt` drawing on a small beige rounded square) instead of a lucide icon.
3. **No `StatTile` rows on customer pages** (shrines, vows, account, orders). `StatTile` stays for provider/admin. Counts go into tab/filter chips ("ทั้งหมด 4", "รอจ่าย 1").
4. **One status block per order**: `StatusLine` (a sentence + a thin segmented progress line + optional next action) replaces pill + stepper + side-panel status + duplicate notices on detail pages. List rows show only the `OrderStatusBadge` pill.
5. **Lists are grouped**: `ListGroup` + `ListRow` (one bordered container, hairline dividers, whole row is the link). Replaces "every row its own `surface` box" in settings, account, notifications, FAQ, orders, vows, addresses. Form fields sit directly on the page, never inside a card.
6. **Product card** is image-first: image full-bleed to the card edge, then kind (muted) · name · area/rating · price. No "ค่าศาล" label, no divider, no arrow circle (the whole card is the link), no big `variant="feature"` card. Price on cards is black. Heart (save) stays.
7. **Home**: exactly ONE beige `surface-hero` (the hero). Signed-in users with active orders start with "งานของคุณ" (the NEXT ACTION per order is the row title: "จ่ายมัดจำ ฿3,270", "ตรวจรับงาน"); everyone else starts with the hero. No login banner (the header has login). Vow teaser is a plain hairline split section.
8. **Type hierarchy**: cut subtitles/descriptions under titles by ~70% (most restate the title). Use ONE muted level (`text-muted-foreground`). Delete `description` from `SectionTitle` unless it adds a condition the title does not carry.
9. **Colour of money**: `Price` is black by default. `<Price emphasis>` (vermilion) only for the single deciding price of a page (product page price, the amount to pay at checkout). `plain` is a deprecated no-op.
10. **Trust**: `TrustNote` is the one named element for the app's real promises (deposit held until you confirm, shops verified, cancel until the shop confirms). Place it beside the price on the product page, at checkout, and in the home trust row. Copy stays TRUE: payments are still simulated, so next to any pay button pass `testMode={IS_MOCK_PAYMENT}`; never write "escrow", never promise outcomes.
11. **Buttons stay ACTIVE**. A disabled primary button looks broken. Validate on press: show `FieldHint error` under the invalid field(s), then `focusFirstInvalid(formRef.current)`. `disabled` is only for "work in progress" (`loading`) or truly impossible actions.
12. **Navigation**: phone `BottomNav` = หน้าแรก / เลือกดู (→ /browse) / งานของฉัน / สมุดบน / บัญชี. "ศาลของฉัน" lives in the account menu (it is still in the desktop header and shown as a shortcut on home when the user has a shrine). `/shrines/*` counts as under บัญชี on phone. Desktop header under `/provider` swaps its nav to the shop's items (งาน, คำขอ, สินค้า, ข้อมูลร้าน → `/provider?tab=…`) and the "ร้านของฉัน" pill becomes "กลับไปหน้าลูกค้า"; under `/admin` the same with the admin views.
13. **Browse on phone**: one chip row = "ตัวกรอง" button + kind chips; the button opens a `BottomSheet` with area / price / sort. Desktop keeps the left sidebar.
14. **Dates are Thai**: never `<Input type="date">` (it shows mm/dd/yyyy Gregorian). Use `ThaiDateField` (พ.ศ.). Date+time: `ThaiDateTimeField`.
15. **Wizard / checkout progress**: `ProgressBar` ("2/4") for multi-step forms; checkout does not repeat a second stepper. Step content slides with `StepSlide`.

History addendum: v5 (flat) was kept; v6 adds the arch identity and removes clutter. Do not bring back eyebrows on every section, icon circles on every row, stat rows on customer pages or red prices on every card.

#### Identity
- `ArchMark` (`src/components/brand.tsx`): two roof strokes + the vermilion doorway arch, uses `currentColor` + `--gold`, so it follows light/dark. `variant="solid"` is a one-roof version for ≤20px.
- `Wordmark`: arch + "ศาล" (font-display) + "Saan" (muted). `size="sm|md|lg"`, `latin={false}` hides "Saan". Used in the phone header (home), `SiteHeader`, `SiteFooter`, the mobile footer on home. Also used on the login page (`size="lg"`). `src/app/icon.svg` is the same mark on a warm-black tile (it is also the manifest icon).
- The arch repeats: `arch-top` utility (top corners = half circle, `--arch-r` default 7rem; set `[--arch-r:7rem]` per use) for the product hero and home hero image (`<ShrineImage arch …/>`), the active BottomNav marker (a small arch rising from the tab's bottom edge), `SuccessMark` (an arch with a check), `EmptyState` (art inside an arch), `TrustNote` (arch mark), and the header nav underline (`rounded-t-full`). Use arch crops only on large images (≥14rem wide), never on list thumbnails.

#### New / changed components (all in `src/components/`; read the file for the full prop docs)
| Component | Props and use |
|---|---|
| `ThumbArt` (`thumb-art.tsx`, also exported from `visuals`) | `kind` (ShrineKind) or `service` (ServiceArtName) or `src`; `size="sm\|md\|lg"` (3/4/5rem). Square rounded-lg beige tile with a drawing. Leading element of a `ListRow`. |
| `ListGroup`, `ListRow` (`list-group.tsx`) | `<ListGroup label? bare?>` wraps `<ListRow href? onClick? thumb? title meta? trailing? tone="danger"?>`. Whole row is the link; trailing defaults to a chevron when interactive (`trailing={null}` removes it; pass a pill, a Price, a switch or a button instead). `bare` = hairlines top/bottom only, no box. Example: `<ListGroup><ListRow href="/settings/profile" title="ข้อมูลส่วนตัว" meta="ชื่อ เบอร์โทร"/></ListGroup>` |
| `StatusLine` (`status-line.tsx`) | `title` (sentence), `detail?`, `steps?: string[]`, `step?` (0-based current), `tone` (`wait\|info\|good\|bad\|neutral` = dot colour), `children?` (one next-action button). `<StatusLine title="ร้านกำลังเตรียมงาน" detail="นัด อา. 18 ต.ค. 06:41" steps={[…5 labels]} step={3} tone="wait"/>` |
| `TrustNote` (`trust-note.tsx`) | `items?: ("deposit"\|"verified"\|"cancel")[]` (default all three), `layout="stack"\|"row"`, `testMode?: boolean` (shows "โหมดทดสอบ ยังไม่มีการตัดเงินจริง"; REQUIRED when next to a pay button: pass `IS_MOCK_PAYMENT`). |
| `FieldHint`, `focusFirstInvalid` (`field-hint.tsx`, client) | `<FieldHint id error?>helper text</FieldHint>` goes under a field; `error` swaps to red text with an icon. `focusFirstInvalid(rootEl)` scrolls to and focuses the first `[aria-invalid="true"]`. See "Validate on press" below. |
| `ProgressBar` (`progress-bar.tsx`) | `value` (1-based step), `max`, `label?`. Thin line with "2/4". |
| `StepSlide` (`step-slide.tsx`, client) | `<StepSlide step={n}>…current step…</StepSlide>`: new step slides in from the right (forward) or left (back), 250ms; enter-only (the old step is replaced at once). Children remount per step. |
| `PriceTicker` (`price-ticker.tsx`, client) | `amount`, `size`, `emphasis?`: the number counts to the new value over 400ms when `amount` changes (not on first paint). For totals that change with options. |
| `Price` | `emphasis` (vermilion) replaces `plain`. Default black. |
| `ThaiDateField`, `ThaiDateTimeField` (`thai-date-field.tsx`, client) | `ThaiDateField name? id? defaultValue? | value+onChange min? max? placeholder? aria-invalid? aria-describedby?`. Posts `yyyy-mm-dd` through a hidden input (same `name` contract as `input type=date`). Shows "23 ต.ค. 2569", opens a Thai month grid in a `BottomSheet` (44px cells, arrow keys / Home / End / PageUp / PageDown, Shift+PageUp/Down = year, disabled outside min/max, "เลือกวันนี้"). `ThaiDateTimeField name defaultValue="yyyy-mm-ddTHH:mm"`: Thai date + native `type=time`; posts `yyyy-mm-ddTHH:mm`, empty until both are set. No native `required`: validate on press. Helpers in `thai-date.ts`. |
| `BottomSheet` | new props: `open` / `onOpenChange` (controlled, `trigger` optional), `stagger` (content rises group by group; give children `style={{"--i": n}}`), `triggerLabel`. `BottomSheetClose` = a close button you can style as the sheet's primary button. |
| `ShrineImage` | new props: `arch`, `flush` (no own radius, for full-bleed in a card), `showCaption` ("ภาพประกอบ" pill, only when drawing; use on large placements). |
| `ArchMark`, `Wordmark` | see Identity. |
| `SectionTitle` / `SidePanel` | `eyebrow` ignored. |
| `ProductCard` | new look (rule 6); `variant`, `compact`, `showShop` accepted and ignored. |

#### Illustration set (relaxed from "thin line only")
`src/components/shrine-art.tsx`: art may use FILLED flat shapes plus a uniform ink line (`vector-effect: non-scaling-stroke`, so a 56px thumb and a 600px hero have the same line weight). Still no gradients, shadows, blur or new colours: only `--art-line/soft/mid/paper/accent` and the v6 art tones `--art-deep` (deeper beige: roofs, bases), `--art-ground` (floor) and `--art-leaf` (muted green, plants). Both themes are defined.
- `KindArt kind`: five distinct silhouettes: pole shrine (tall, two roofs, garlands, incense, plant), low chao-thi (wide single roof, two figures, elephant figurines), pair (pole + low shrine behind a picket fence, joined by a garland), phra-phrom (stepped plinth, three vermilion/beige tiers, candle posts, garlands), modern (flat slab roof, glass wall, vermilion slat, planters).
- `ShrineScene kind seed`: seed picks one of 6 genuinely different backdrops (concrete wall + evening sun, garden + moon, picket fence + low sun, garland arch niche, courtyard with potted plants + clouds, dawn hills), one of 3 sky tones, mirroring and size. The backdrop is anchored to the bottom edge so the ground meets the shrine's feet at every aspect ratio. Never an empty beige box.
- Large placements without a photo: `<ShrineImage showCaption …/>` so a drawing is never mistaken for a product photo. Real photos (`src`) always win.
- Dark mode: the `--gold-soft` backdrop was desaturated (no brown frames); price is black by default (no glowing vermilion on near-black).

#### Motion additions (all off under reduced motion; same tokens as v5.1)
- Option-card selection: `button.surface[aria-pressed]` (the existing `OptionCard` and any `<button class="surface" aria-pressed>`) now draws the vermilion ring in `--dur-fast` and pops the right-hand radio dot; no markup change needed.
- `PriceTicker` (400ms count), `StepSlide` (250ms slide), `ProgressBar` fill (400ms width), `StatusLine` segments (300ms colour), BottomSheet filter content (`stagger`, 50ms apart), calendar day hover (150ms).

#### Validate on press (replaces disabled primary buttons)
```tsx
const [errors, setErrors] = useState<{ date?: string }>({});
const formRef = useRef<HTMLFormElement>(null);
function submit() {
  const next: typeof errors = {};
  if (!date) next.date = "กรุณาเลือกวันที่";
  setErrors(next);
  if (Object.keys(next).length) { requestAnimationFrame(() => focusFirstInvalid(formRef.current)); return; }
  startTransition(async () => { /* action */ });
}
// …
<Label htmlFor="date">วันที่สะดวก</Label>
<ThaiDateField id="date" name="date" value={date} onChange={(v) => { setDate(v); setErrors({}); }}
  aria-invalid={Boolean(errors.date)} aria-describedby="date-hint" />
<FieldHint id="date-hint" error={errors.date}>ต้องเลือกอย่างน้อย 1 วัน</FieldHint>
<Button variant="gold" size="xl" loading={pending} onClick={submit}>ยืนยัน</Button>
```
The button is never `disabled` for missing data. No shaking animation.

#### What to delete when you see it (checklist for page designers)
- A red `eyebrow` on a `SectionTitle`, `SidePanel` or any heading below the page title; any eyebrow that repeats the page title or category.
- `description` under `SectionTitle` that restates the title; subtitles that repeat the title; more than one muted grey tone.
- `IconTile` on option cards (province, budget, place, kind), FAQ rows, settings/menu rows, notification rows. Replace with plain text, or `ThumbArt` when the row is a shrine/service.
- Each list row wrapped in its own `surface` box (settings, account, notifications, FAQ, orders, vows, addresses): use `ListGroup`/`ListRow`.
- `StatTile` rows on customer pages (use counts in chips). Keep on provider/admin.
- Pill + `Stepper` + side-panel status + `Notice` all describing the same order status: one `StatusLine`.
- `Price` with `plain` (no-op now) and any vermilion price that is not THE deciding price: leave default black; add `emphasis` only for the product-page price and checkout amount.
- `<Input type="date">` / `datetime-local`: `ThaiDateField` / `ThaiDateTimeField`.
- `disabled={…incomplete}` on a primary button: validate on press.
- A second `Stepper` in checkout; wizard circles: `ProgressBar` + `StepSlide`.
- Hand-written product cards, `variant="feature"`, "ค่าศาล" labels, arrow-in-circle affordances.
- More than one beige `surface-hero` on a page; beige boxes around teasers/banners.
- Brand text/dots ("Saan" with a vermilion dot): use `Wordmark`.

### Palette (tokens exist in `:root` and `.dark`; use ONLY these via Tailwind classes, never hex or `oklch()` in pages)

| Token / class | Light | Dark | Use |
|---|---|---|---|
| `bg-background`, `bg-card`, `surface` | pure white | warm black (page) / raised near-black (card) | page ground and cards. Cards are defined by a 1px border, not elevation |
| `bg-canvas` | very light beige | black | outside the column on wide screens only |
| `bg-muted`, `bg-secondary`, `surface-quiet`, `surface-hero` | warm beige | slightly lighter warm black | quiet panels, icon tiles, the one featured panel per page, hover fills |
| `text-foreground` | near-black | warm ivory | text |
| `text-muted-foreground` | grey (6.3:1 on white) | grey ivory (7.5:1) | secondary text (still `text-sm`+) |
| `border-border` / default `border` | warm 1px line | ivory at 12% | all hairlines and card borders |
| `border-input` | 3:1 grey | 3:1 grey | borders of fields and switch-off tracks (a11y floor) |
| `bg-primary text-primary-foreground` | black, white text | ivory, black text | the normal primary button, active chip, switch-on. In dark it is LIGHT |
| `bg-gold text-gold-foreground hover:bg-gold-hover` | vermilion (ชาด), white text | same, white text | THE accent. Only: the one hero action per screen (`<Button variant="gold">`), selected rings, status dots/marks. Hover goes to deep burgundy |
| `text-gold-ink` | deep vermilion (5.2:1 on white) | light coral (7:1) | accent text: eyebrows, `Price`, links that need emphasis |
| `bg-gold-soft`, `border-gold-line` | pale vermilion / 40% vermilion | dark vermilion / 45% | rare tinted fills and lines |
| `bg-tint-{mint,amber,rose,sky,violet}` + `text-tint-*-ink` | very pale tints | deep tints | ONLY small status pills and `Notice` boxes. Always pair with the matching `-ink` |
| `bg-marigold` / `fill-marigold` | amber | amber | star ratings only |
| `bg-destructive text-destructive-foreground` | red | coral | errors, unread badge |
| `--art-*` | | | illustration colours (line, beige fill, accent); only used in `illustrations.tsx` |

NAMING NOTE: the `gold-*` family (`gold`, `gold-foreground`, `gold-ink`, `gold-soft`, `gold-line`, `gold-hover`, `shadow-gold`, `variant="gold"`, `IconTile tint="gold"`) is historical. It now means the vermilion accent. Do not rename it in pages; do not use it for anything decorative. `shadow-card`, `shadow-float`, `shadow-gold`, `hairline-gold` and `float-soft` still exist so old class names do not break, but they render nothing: do not write them in new code.

Contrast is checked AA in both themes (white on vermilion 4.9:1; accent text on white 5.2:1; on near-black 7:1+). Do not introduce new colours.

### Typography
- Body, buttons, forms: DM Sans for Latin and digits, falling through to Anuphan (loopless Thai). Utility: `font-sans` (default).
- Headings (`font-display`): DM Sans for Latin and digits, falling through to Prompt (geometric loopless Thai), ALWAYS `font-normal` (400) for page titles, hero headings, prices, big numbers and empty-state titles. Section titles (`SectionTitle`) are `font-medium`. There is no serif anywhere and no `font-bold`/`font-semibold` in headings. UI emphasis (buttons, card titles, labels) is `font-medium`.
- Scale (rem only, the app has a large-text mode): page title `text-[1.75rem] leading-[1.3]`; hero `text-[1.75rem]` (sm:`text-3xl`); section title `text-xl`; card title `text-base font-medium`; body `text-base`; secondary `text-sm text-muted-foreground`. NOTHING below `text-sm` (no `text-xs`, no `text-[0.7rem]`), tap targets at least 44px (`min-h-11`).
- Thai: no letter-spacing on Thai, no `leading-none`/`leading-tight` on multi-line Thai (line-heights are raised globally), headings are `text-balance`.
- `eyebrow` utility: small accent label above the PAGE title only, at most one per page (v6 rule 1). `SectionTitle eyebrow` is ignored. Sentence case Thai, never uppercase English.
- `numeric` (tabular figures) on prices, counts, phone numbers.

### Radius, borders, elevation
- NO shadows anywhere, no blur, no gradients, no glow blobs. Depth = 1px border + whitespace.
- Everything interactive is a full pill: buttons (`size="xl"` is 48px tall; the row/pill look comes from the component), `Input`, `Chip`, icon buttons, `TonePill`, `SampleBadge`, bottom-sheet close. Text areas are `rounded-2xl`.
- Cards: `surface` = 1rem radius, 1px `border-border`, white. Option/selection card: add `border-primary` (the stylesheet turns it into a 2px vermilion ring; do not add `bg-secondary` yourself). Images `rounded-lg`. Featured panel: `surface-hero` (beige, 1.5rem radius, no border), one per page.
- Do not use arbitrary radii (`rounded-[1.25rem]`); use `rounded-lg` (1rem), `rounded-2xl`, `rounded-full`.
- Separate sections with space and hairlines (`border-t border-border`), not boxes.

### Shared components (read the file before using; implementers must not modify them)
- `AppShell` (`nav`, `width`, `wide`, `footer`, `desktopFooter`, `side`): page frame. Phone/tablet: one centred column (max-w-md → 2xl, 1px side borders from `md`). Desktop (`lg`+): see "Desktop layout" below. `footer` = the one sticky primary action on phones (white bar, top border). Never pass both `nav` and `footer`.
- `PageHeader` (`title`, `subtitle`, `backHref`, `action`, `eyebrow`): back button is a bordered circle; `eyebrow` only when informative (v6). `SectionTitle` (`action`, `description`, `className`; `eyebrow` is accepted but renders nothing).
- `BottomNav`: flat white bar with a top border; active tab = darker label, thicker icon, short vermilion bar on the top edge.
- `IconTile` (v6: only where a symbol aids recognition; see rule 2; for shrines/orders/services use `ThumbArt`): neutral beige circle with a black icon for every tint name (mint/amber/… are accepted but all render neutral); `tint="gold"` = pale vermilion circle with accent icon, use for at most one or two tiles per page. `Monogram` (initial in a bordered circle). `ShrineImage` (beige, `rounded-lg`). `EmptyState` (`art`: shrine, garland, lotus, bell, search; every empty list gets one plus a next-step button).
- Illustrations (`ShrineArt`, `GarlandArt`, `LotusArt`, `BellArt`, `SearchArt`, `Art`): flat thin-line SVG, beige fills, one vermilion accent, theme-aware. Give them a size class (`size-40`).
- Shrine and service imagery (`src/components/shrine-art.tsx`, exported from `visuals.tsx`): `KindArt kind` (one distinct drawing per `ShrineKind`: pole shrine, low chao-thi shrine with two figures, pair, tiered phra-phrom, modern), `ServiceArt name` (`install`, `move`, `repair`, `vow`, `ceremony`, `offering`), `ShrineScene kind seed` (a kind drawing on a backdrop whose tone, decoration, size and mirroring are chosen from `seed`, so cards differ; used by `ShrineImage` when there is no photo). Pass `kind` and `seed={id}` to `ShrineImage` wherever the data has them; real `src` photos still win.
- `Button` variants: default (black/ivory pill), outline (1px black-20% border, transparent), secondary (beige), ghost, destructive, gold (vermilion), link; sizes `xl` (every real action), `icon-xl`. `LinkButton` takes the same props.
- `Input`, `Textarea`, `Label`: flat, 1px `border-input`; focus = black/ivory border.
- Status: `OrderStatusBadge`, `RequestStatusBadge`, `VowStatusBadge`, `ProviderStatusBadge`, `TonePill` (`tone`: neutral / wait / info / good / bad): small pale pills.
- `Chip` (+ `chipClass`): outline pill; active = black fill. `Price`: black regular-weight number; `emphasis` = vermilion for the one deciding price of a page (v6 rule 9); `PriceTicker` for totals that change. `Rating` (amber stars). `StatTile` (provider/admin only, v6 rule 3), `Stepper` (for wizards prefer `ProgressBar`; for one order use `StatusLine`) (done = black, current = 2px vermilion ring, `info` = neutral numbers), `Notice` (tinted box, `rounded-lg`), `Divider`, `OrnamentDivider` (now just a hairline), `BottomSheet`, `ThemeToggle`, `Rise`, `SampleBadge` (dashed accent pill), `SoonBadge`, `SoonButton`, `ImageUpload`, `NotificationBell` (bordered circle).
- Route-shared: `MenuRow` and `ToggleRow` in `src/app/settings/`.

### Patterns
- **List row** (v6): `ListGroup` + `ListRow` (one bordered container, hairline dividers). Leading `ThumbArt`/`Monogram` only when it helps; text column (title `text-base font-medium`, one muted meta line); trailing chevron, value or status pill. Not one `surface` box per row.
- **Product card** (v6): always the shared `ProductCard` (`src/components/product-card.tsx`; used by home, browse, shop). Full-bleed image, kind (muted), name, area with a verified mark (+n), rating only when `reviewCount > 0`, black price. No feature variant, no arrow circle. Never hand-write a product card.
- **Detail page**: `PageHeader backHref` (eyebrow = category), hero image, `Price`, `surface` cards per topic, facts in `surface-quiet`. Primary action in `footer`.
- **Form page**: `footer` holds the submit button (`form="id"`); each field is `Label` + `Input`; choices are option cards with `aria-pressed`.
- **Hero**: one `surface-hero` panel with a regular-weight title, one sentence and the single `variant="gold"` action (an eyebrow only if it adds information, e.g. the greeting). Hero art is a `ShrineImage arch showCaption` while there is no real photo.
- **Editorial rhythm (home)**: numbered sections (grey numbers `01`, `02` ...), a sticky heading beside a hairline-separated list with `ServiceArt` thumbnails, a uniform 3-column product grid, a 4-step numbered strip, a `TrustNote layout="row"` of TRUE statements (no invented statistics), a hairline split vow-book teaser. Hairlines instead of boxes; decorative icon-in-circle only where it carries meaning.
- **Empty list**: `EmptyState` + next-step button.

### Dark mode do's and don'ts
- DO use tokens only; you should almost never write `dark:`. DO test both themes (`/account` or `/settings/display` toggle; the browser pane can emulate `prefers-color-scheme`).
- DON'T use `bg-white`, `bg-black`, `text-white`, hex colours, `text-primary` on the accent, or shadows.
- DON'T put text on a tint without its `-ink` colour.
- A `.light` / `.dark` wrapper class re-scopes all tokens for a preview of a specific theme (see `ThemeToggle`).

### Motion (v5.1: one small language, flat and calm)

Principle: motion explains (where did this come from, did my tap work), it never decorates. Nothing loops except the skeleton pulse, nothing parallaxes, no auto carousels, no bounce on big things. Everything is switched off under `prefers-reduced-motion` (global block at the end of `globals.css`; View Transition pseudo-elements and `[data-reveal]` are handled there too). Use these tokens, do not invent new durations or curves.

**Tokens** (CSS variables in `globals.css`; Tailwind classes `ease-soft`, `ease-spring`, `ease-smooth` exist for the same curves)

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 150ms | press, hover fill, small toggles |
| `--dur-base` | 250ms | state changes (chip, accordion, link underline) |
| `--dur-slow` | 400ms | entrances (`rise`, page-in) |
| `--ease-out` / `ease-soft` | cubic-bezier(0.22, 0.8, 0.24, 1) | default for everything that enters or settles |
| `--ease-spring` / `ease-spring` | cubic-bezier(0.34, 1.45, 0.5, 1) | only small things that "pop": heart, active tab icon |
| `--ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | skeleton pulse |

**Utilities and components**

- Entrance on load (first 3-5 blocks of a page): `<Rise i={n}>` / class `rise` (+ `--i` stagger, 70ms each). Below the fold: `<Reveal as="li" i={index % 4}>` (`src/components/reveal.tsx`, IntersectionObserver, 14px rise + fade; content is already visible without JS, and blocks already on screen at mount are never hidden). Do not wrap the same block in both.
- Page transitions: `src/app/template.tsx` wraps every route in React `<ViewTransition enter="page-in" exit="page-out" default="none">` (Next 16.4 / React 19.3 need no config flag; Link navigations are transitions). Old page fades out 140ms, new page fades in and rises 12px over 260-380ms. CSS: `::view-transition-new(.page-in)` etc. in `globals.css`. Browsers without support just navigate.
- Shared elements: the product image morphs from card to detail (`<ViewTransition name={`product-${id}`} share="morph-image" default="none">` on both `ProductCard` and the product page); the active-tab bar slides between tabs (`name="nav-bar-bottom"` / `"nav-bar-top"`, `share="nav-bar"`). To add another shared element use a unique `name` per page and `default="none"`.
- Hover and press: cards `group/card` + image scale 1.04 in 500ms inside the clipped frame (`ShrineImage` does this when the parent has `group/card`), arrow nudge `group-hover:translate-x-1` (`ease-soft`, 200ms), text links `link-draw` (underline draws left to right; `<TextLink>` bundles it with the arrow), buttons/chips transition colour 200ms, `active:scale-95` on icon buttons, theme toggle icons rotate 90deg and swap.
- Pop: `animate-pop` (320ms spring) for the saved heart (only after a tap) and the active bottom-nav icon.
- Count-up: `<CountUp value>` (900ms, ease-out cubic, starts when visible; real value is always in the DOM). `StatTile` uses it for numeric values automatically.
- Skeletons: `<Skeleton>` (opacity pulse 1.6s, no shimmer), shaped blocks in `src/components/skeletons.tsx` (`ProductCardSkeleton`, `ProductGridSkeleton`, `RowSkeleton`, `ListSkeleton`, `HomeSkeleton`, `HeaderSkeleton`). Every list or detail route gets a `loading.tsx` with the same shape as the page (exists for `/browse`, `/orders`, `/products/[id]` and the generic root); the home page streams its content inside `<Suspense fallback={<HomeSkeleton />}>`.
- Feedback: `<SuccessMark className="size-20" />` (ring scales in, check mark draws, 420ms) for payment / review / save success; `<Button loading>` shows a spinner and disables the button; `details` elements everywhere animate their height (`::details-content`, Chromium; others just snap); `Notice` rises in; `Stepper` connectors draw in sequence; sheets and dialogs enter with 300ms `ease-soft` (the backdrop is a flat 40% dim, no blur).
- Theme change crossfades via `html.theme-fade` (done by `ThemeToggle`).
- Reduced motion: never rely on an animation to convey state; end states must be correct without it.

### Desktop layout (from `lg` = 1024px; phone and small tablet are unchanged)

Idea: phone and tablet keep the single column with the bottom tab bar. From `lg` the app is a website: a global top header, a wide centred container, and pages built from a main column plus a sticky side column. Only LAYOUT changes on desktop; tokens, type, pills, borders-not-shadows and both themes stay exactly v5. Checked widths: 1024, 1280, 1440, 1920 (content is capped at `max-w-7xl` = 80rem and centred; beyond that the margins are plain white / warm black).

#### Breakpoint rule
- Write phone styles as the default and desktop styles with `lg:` (and `xl:` for 1280+). Never write a `max-lg:` layout from scratch; use `max-lg:hidden` / `lg:hidden` only to swap a phone-only block for a desktop-only block.
- `md` (tablet) is still the phone layout in a wider column. Do not design for `md` separately.
- Pointer targets on desktop may be denser (`lg:min-h-10`, never below 36px / `min-h-9`). Touch targets below `lg` stay `min-h-11`. Text sizes never go below `text-sm`, and everything must survive `html.text-large` (rem only; test 1024 with large text).
- `cursor: pointer` on buttons, switches and `label[for]` is set globally (Tailwind v4 resets it). Focus ring is the global `:focus-visible` outline; add `hover:bg-muted` (or `hover:text-foreground` on quiet text) to every clickable thing.

#### Global chrome (already in the root layout; pages must not add their own)
- `SiteHeader` (`src/components/site-header.tsx`, server component rendered by `src/app/layout.tsx`, `hidden lg:block`, sticky, 4.5rem tall): brand, nav (หน้าแรก, เลือกดูศาล, ศาลของฉัน, สมุดบน, งานของฉัน; active = darker label + short vermilion bar on the header's bottom line), search field (`/browse?q=`, prefilled on `/browse`), one-button light/dark toggle (`<ThemeToggle variant="button" />`), then for signed-in users: "ร้านของฉัน" pill if they own a shop, "ผู้ดูแลระบบ" pill for ADMIN, notification bell with unread count, account link (initial + name) to `/account`; signed out: "เข้าสู่ระบบ". The user-dependent part streams inside a `<Suspense>`. Nav items live in `site-header-parts.tsx` (client, uses `usePathname`). Icons given to a client component must be passed by NAME (see `HeaderPill`), never as component props from a server file.
- `SiteFooter` (`src/components/site-footer.tsx`, `hidden lg:block`): brand, copyright, links ช่วยเหลือ / คู่มือ / ข้อกำหนด / ความเป็นส่วนตัว / สำหรับร้านค้า. The body is a flex column (`min-h-dvh`), so the footer sits at the bottom of short pages.
- `BottomNav` is `lg:hidden`. `NotificationBell` (the page-level one) is `lg:hidden` because the header has the bell: keep putting it in `PageHeader action` for phones, it disappears on desktop by itself. Do not render your own brand/login/search header block on desktop (home hides its phone header with `lg:hidden`).
- CSS variables: `--site-header-h` (0 on phone, 4.5rem on desktop) for sticky offsets; `--section-mt` (2.5rem, 3.5rem on desktop) used by `SectionTitle`.

#### `AppShell` on desktop
- `width`: `"narrow"` (`lg:max-w-2xl`, single short form), `"reading"` (default, `lg:max-w-4xl`: lists, one-column detail, documents), `"full"` (`lg:max-w-7xl`: catalogue, two-column pages, dashboards). `wide` is the old name for `"full"`. Phone is not affected.
- `footer` (the sticky phone action bar): on desktop it is NOT sticky. By default (`desktopFooter="inline"`) it becomes the end-of-form action: a hairline, then the content, at most 28rem wide, left aligned with the content (`lg:*:max-w-md`). Keep passing `footer` exactly as before for form pages; no change needed. When the primary action lives in the sticky side panel (product detail, checkout), ALSO pass `desktopFooter="hide"` and put the real button in the panel (duplicate it with `hidden lg:inline-flex` if it must submit a form: `form="id"`).
- `side`: node shown as a left nav column on desktop only (pass `<AccountNav />` or your area's nav). The page content becomes the right column (max `3xl`, container `6xl`); add `width="full"` for a wide workspace (container `7xl`, content takes all the remaining width). `PageHeader`'s back link hides itself when `side` is present.
- `PageHeader`: on desktop the round back button becomes a small text link above the title (`backLabel`, default "ย้อนกลับ"; give a real label such as `backLabel="เลือกดูศาล"`), the title is `lg:text-[2.25rem]`. `SectionTitle` is `lg:text-2xl` with larger top margin; a caller's own `mt-*` still wins (use `lg:mt-0` for the first title in a column).

#### Layout primitives (`src/components/`)
- `TwoColumn` (`page-layout.tsx`): `<TwoColumn aside={<SidePanel …/>} side="right|left" asideSize="md|sm" asideOn="after|before|hide" sticky>main</TwoColumn>`. Main column plus a side column that sticks under the header (and scrolls inside itself if taller than the window). `asideOn` is the phone order: `"after"` (summary below the content), `"before"` (filters above results), `"hide"` (phone already has that block elsewhere, e.g. the order options inline plus the sticky bottom bar). Right/`md` = 22rem (24rem at `xl`) for order and summary panels; left/`sm` = 14rem (16rem at `xl`) for filters.
- `SidePanel` (`page-layout.tsx`): the card inside a TwoColumn aside (`surface p-5 lg:p-6`, optional `title`/`eyebrow`). The page's single `variant="gold"` action goes at the end of it.
- `CardGrid` (`page-layout.tsx`): `<CardGrid cols="products|products-side|list|cards|tiles">` renders a `<ul>`; wrap children in `<li>`. `products` 2 → 3 (sm) → 4 (lg), `products-side` 2 → 3 → 4 (xl) beside a sidebar, `list` 1 → 2 (lg) for row cards (orders, vows, addresses), `cards` 1 → 2 → 3, `tiles` 2 → 3 → 4 for `StatTile`. Override with `className="lg:grid-cols-3"` when the item count needs it (home shows 6 products in 3 columns).
- `SideNav` (`side-nav.tsx`, client): `groups: {title?, items: {href, label, icon, exact?, badge?}[]}[]`, pill rows, active = beige fill + semibold + vermilion dot (or `badge` number). Because icons are components, define each area's nav in its own `"use client"` file, like `src/app/settings/account-nav.tsx` (`AccountNav`: บัญชีของฉัน + ตั้งค่า), then use `<AppShell side={<AccountNav />}>` on every page of that area.
- `DataTable` (`data-table.tsx`): `columns: {key, header, cell(row), align?, className?}[]`, `rows`, `rowKey`, `rowHref?` (whole row clickable), `caption` (screen-reader title). It is `hidden lg:block` by itself: pair it with the card list for phones (`<div className="lg:hidden">cards</div><DataTable …/>`), or use it as a desktop-only enrichment as the account page does ("งานล่าสุด").
- `ChipRow` (`chip.tsx`): wrap every row of `Chip`s in it instead of hand-writing `-mx-5 flex overflow-x-auto px-5`. Phone: horizontal scroller bleeding to the screen edge; desktop: wraps, no scrolling. `Chip` is `lg:min-h-10`.
- `BottomSheet` is a centred dialog (max `lg`, rounded 3xl, no drag handle) on desktop automatically. `ThemeToggle variant="button"` = single round toggle (header). `BellLink` (`notification-bell.tsx`) = bell without data fetching.
- `OrderPanel`-style compact choices: when option cards would make a sticky panel too tall, render 2-column tiles (see `ChoiceTile` in `src/app/products/[id]/order-panel.tsx`, `layout="grid"`).

#### Patterns per page type
- **Catalogue / list with filters** (`/browse`): `AppShell width="full"`, `PageHeader`, `TwoColumn side="left" asideSize="sm" asideOn="before"`. Filters are `ChipRow`s on phones and vertical pill rows in the sidebar (same links rendered twice, one hidden). Result count + removable active-filter pills + sort chips sit in a row above a `CardGrid cols="products-side"`.
- **Detail** (`/products/[id]`): `width="full"`, `desktopFooter="hide"`, `PageHeader backHref backLabel`, `TwoColumn` with the order/summary `SidePanel` (price, choices, gold button) on the right (`asideOn="hide"` if the phone has an inline section + sticky bottom bar). Image `lg:aspect-[16/10]`. Facts `grid-cols-2 xl:grid-cols-3` (3 columns are too tight at 1024).
- **Form / checkout**: single forms use `width="narrow"` (or `reading`) and keep `footer` (inline at the end on desktop). A multi-section checkout uses `width="full"` + `TwoColumn` with the sticky summary and the confirm button in the panel plus `desktopFooter="hide"`. Group related inputs in rows (`xl:grid xl:grid-cols-3` for three dates). Never leave a primary action only in a bar glued to the bottom of the window.
- **Area with sub-pages** (settings, shop workspace, admin): `AppShell side={<AreaNav />}` on every page of the area; the hub page shows the same items as a `lg:grid-cols-2` grid of `MenuRow`s; sub-pages drop their back link automatically.
- **Dashboard / workspace**: `width="full"` (with `side` for nav), `CardGrid cols="tiles"` for `StatTile`s, `DataTable` for dense lists (orders, providers), cards on phones. One `surface-hero` per page still.
- **Home / marketing**: hero is a two-column `surface-hero` (text + art 18rem, `lg:text-[2.75rem]`), service cards 3 across, product grid 3 across. Phone-only blocks (own header, search, footer links) get `lg:hidden`.

#### Do / don't
- DO keep phone markup and classes as the base and add `lg:` on top; DO test 1024, 1280, 1440, 1920, light + dark, and `text-large` at 1024.
- DO put the page's one gold action in the sticky side panel (or at the end of the form), and `desktopFooter="hide"` the phone bar.
- DO use `TwoColumn`/`CardGrid`/`ChipRow`/`SideNav` instead of ad-hoc `grid-cols-*`/`overflow-x-auto` per page.
- DON'T render a second header, brand, bottom bar or login button for desktop. DON'T put `sticky` things at `top-0` (use `lg:top-[calc(var(--site-header-h)+1.5rem)]`). DON'T make a sticky panel taller than ~`100dvh - 7rem`; compact it. DON'T stretch text lines beyond ~`max-w-3xl`. DON'T add shadows, blur or new colours for "desktop polish": depth is still 1px border + whitespace.
- DON'T pass component references (lucide icons, render functions) from a server component to a client component; pass names or define the data inside the client file.

### Sample data and UI-only features
- Prefer deriving UI from real data the page already has. Use sample content only when no real data exists.
- All sample data lives in `src/lib/mock/` (one file per topic) and starts with `// UI-ONLY: no backend yet` plus what backend would be needed. Current files: `promotions.ts`, `holy-days.ts` (currently unused by any page).
- Every section showing sample content that a customer could mistake for fact (reviews, ratings, counts, prices, dates, promotions) shows `<SampleBadge />` (normally in `SectionTitle action`). `Rating` has a `sample` prop.
- A control with no backend must either work client-side (e.g. localStorage) or be a `SoonButton` / carry a `SoonBadge`. Never a button that silently does nothing.
- Never invent ratings, testimonials or statistics as real; never promise luck or the outcome of a vow; copy stays polite, plain Thai.

## Shared building blocks (read first; implementers must not modify them)

- UI components: see the list under Design direction (everything in `src/components/`, plus `src/app/settings/menu-row.tsx` and `toggle-row.tsx`).
- `src/app/globals.css` — tokens for light and dark, utilities (`surface`, `surface-hero`, `rise`, …). `src/app/layout.tsx` — fonts, ThemeProvider, viewport theme colours.
- `src/lib/constants.ts` — code→Thai label maps (`AREAS`, `SHRINE_KINDS`, `ORDER_STATUS`, …) and `DEPOSIT_RATE`.
- `src/lib/format.ts` — `formatBaht`, `formatDate`, `formatShortDate`, `formatDateTime`, `formatDateOnly`, `formatPhone`.
- `src/lib/types.ts` — every DTO type the UI receives.
- `src/lib/prefs.ts` — cookie/storage keys for text size and theme.
- `src/lib/mock/` — UI-only sample data (see the sample-data rules).

## Data access

- Reading: server components call functions in `src/server/queries.ts` (server-only).
  Auth in pages: `requireUser("/current/path")`, `requireRole("ADMIN", "/admin")` or `getCurrentUser()` from `@/server/auth`.
- Writing: client components call server actions in `src/server/actions/*.ts`. Each takes one plain object and returns
  `ActionResult<T>` = `{ ok: true, data } | { ok: false, error }`. Pattern:

  ```tsx
  const [pending, startTransition] = useTransition();
  function submit() {
    startTransition(async () => {
      const res = await createVow({ place, wish, promise });
      if (!res.ok) { toast.error(res.error); return; }
      router.push(`/vows/${res.data.vowId}`);
    });
  }
  ```
  Actions already refresh all page data; do not call `router.refresh()`.
- Payments are simulated. In server components read `IS_MOCK_PAYMENT` from `@/server/integrations` and, when true,
  show a small amber notice next to any pay button: "โหมดทดสอบ ยังไม่มีการตัดเงินจริง".
- Never import from `@/server/*` (except `@/server/actions/*`) inside a `"use client"` file.

## Rules for implementers

- Only create or edit files inside the route folders assigned to you. Do not touch `src/server`, `src/lib`,
  `src/components`, `prisma`, config files, or another implementer's routes.
- Put route-private client components next to the page (e.g. `src/app/vows/vow-form.tsx`).
- If the backend lacks something you need, do not work around it — say so in your final report.
- Copy tone: polite, plain Thai, short sentences. Never promise luck or outcomes of a vow. No invented statistics, ratings or testimonials.
- Before finishing run `npx tsc --noEmit` and `npx eslint <your folders>` and fix every error.
  Do NOT run `next dev`, `next build`, `prisma` commands or `npm install`.

## Added in the second batch (settings, notifications, chat, shop pages)

- `src/components/notification-bell.tsx` — `NotificationBell` (async server component, prop `userId`); place it in the header of main tab pages.
- `src/server/actions/settings.ts` — `setTextSize`, `updateNotificationSettings`, `saveAddress`, `deleteAddress`, `markNotificationRead`, `markAllNotificationsRead`, `logoutEverywhere`, `deleteAccount`.
- `src/server/actions/extras.ts` — `sendOrderMessage`, `addCareLog`, `deleteCareLog`, `setVowReminder`.
- `src/server/actions/admin.ts` — `setProviderStatus`, `markRefunded`.
- `src/server/queries.ts` — `getSettings`, `listAddresses`, `listNotifications`, `countUnreadNotifications`, `getMyShrine`, `getPublicProvider`, `listPendingRefunds`; `listProducts` now accepts `q` and `sort`; `getOrder` returns `messages`; vows carry `remindAt`.
- `GET /api/me/export` downloads the signed-in user's data as JSON (use a plain `<a href="/api/me/export" download>`).
- Large-text mode: `setTextSize({ large })` sets a cookie that the root layout turns into `html.text-large`. Read the current value in a server component with `(await cookies()).get(TEXT_SIZE_COOKIE)?.value === "large"` (`TEXT_SIZE_COOKIE` from `@/lib/prefs`). Because of this mode, size everything with Tailwind rem utilities — never fixed `px` font sizes.
- Reusable route-local pieces that already exist and may be imported from other routes: `OptionCard` (`src/app/request/option-card.tsx`), `InlineConfirm` (`src/app/request/inline-confirm.tsx`), `OptionCards` / `ToggleChips` (`src/app/provider/pickers.tsx`).
- Notifications are in-app only. Never write copy that promises SMS, LINE or email messages.
