/**
 * Dev-only guard against the iOS focus-zoom bug: iOS Safari zooms the whole page
 * when a focused text field computes to under 16px, and stays zoomed after blur.
 *
 * This checks getComputedStyle rather than class strings, which is the whole
 * point - the bug has shipped twice here through routes a lint rule cannot see:
 * a cva variant adding `text-sm`, and `cn()`/twMerge silently dropping a
 * component's `text-base` because the caller passed `text-sm` in the same
 * font-size group. Computed style is ground truth for all of them.
 *
 * Imported only under `import.meta.env.DEV`, so it is absent from prod bundles.
 */

const MOBILE_BREAKPOINT = 768;
const MIN_FONT_SIZE = 16;

const FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

// Input types that don't take typed text, so iOS never zooms for them.
const IGNORED_INPUT_TYPES = new Set([
  'range',
  'checkbox',
  'radio',
  'color',
  'button',
  'submit',
  'reset',
  'file',
  'image',
  'hidden',
]);

const reported = new WeakSet<Element>();

const isTextEntry = (el: Element): boolean => {
  if (el instanceof HTMLInputElement) {
    return !IGNORED_INPUT_TYPES.has(el.type);
  }
  return true;
};

const audit = () => {
  if (window.innerWidth >= MOBILE_BREAKPOINT) return;

  for (const el of document.querySelectorAll(FIELD_SELECTOR)) {
    if (reported.has(el) || !isTextEntry(el)) continue;

    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
    if (!Number.isNaN(fontSize) && fontSize < MIN_FONT_SIZE) {
      reported.add(el);
      console.error(
        `[field-zoom-audit] ${fontSize}px field will make iOS Safari zoom on focus ` +
          `(needs >= ${MIN_FONT_SIZE}px below ${MOBILE_BREAKPOINT}px). ` +
          `class="${el.className}"`,
        el
      );
    }
  }
};

let scheduled = 0;
const scheduleAudit = () => {
  window.clearTimeout(scheduled);
  scheduled = window.setTimeout(audit, 300);
};

scheduleAudit();
new MutationObserver(scheduleAudit).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'style', 'type'],
});
window.addEventListener('resize', scheduleAudit);
