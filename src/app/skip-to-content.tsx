"use client";

/** Skip repeated navigation without changing the shared page-frame contract. */
export function SkipToContent() {
  return <button type="button" className="skip-content" onClick={() => {
    const main = document.querySelector("main");
    if (!main) return;
    const temporary = !main.hasAttribute("tabindex");
    if (temporary) {
      main.tabIndex = -1;
      main.addEventListener("blur", () => main.removeAttribute("tabindex"), { once: true });
    }
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start", behavior: "instant" });
  }}>ข้ามไปเนื้อหา</button>;
}
