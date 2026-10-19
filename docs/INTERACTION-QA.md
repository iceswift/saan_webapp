# Interaction and responsive QA

20 October 2026, implementation `70cdf76`.

## Fixes

- Root layout adds a first-keyboard-stop “skip to content” button. It focuses the current page's main element and scrolls instantly, without altering shared AppShell. A temporary tabindex is removed on blur. The control is off-screen until keyboard focus and uses theme tokens.
- Main content wraps long unbroken references/URLs. A synthetic order's timeline payment reference previously widened a 325 CSS-pixel viewport to 410 pixels. Text remains complete rather than truncated.
- Request-form step transitions now distinguish forward/backward navigation. Mounted stage containers still preserve form/upload state. Existing reduced-motion CSS disables these transitions.

## Verification scope

Browser viewport and media emulation are temporary QA overrides, not account settings. Use Browser Use viewport capability, inspect effective CSS width (browser zoom may change it), and reset the override afterwards. Use CDP Emulation.setEmulatedMedia for reduced motion, clearing features afterwards. Restore the user's original text size and theme through the display UI.

The initial narrow sweep used an effective 325px CSS viewport. Vows, account, notifications, selection wizard, request form, browse and product detail stayed within the viewport in normal/large-text (19px root) mode. The order overflow was traced to a long timeline reference, rather than hidden with overflow-x. Mobile filter sheet opened with focus on Close, Escape closed it and returned focus to its trigger. Applying a custom THB 1,500 budget preserved BKK. Reduced-motion computed animation/transition durations were 0.00001 seconds on sampled product controls.

Post-deployment keyboard checks, fixed order width, screenshots and remaining limits are recorded in DEPLOYMENT-STATUS.md. This is targeted interaction QA, not a complete accessibility certification or real-device/browser matrix.
