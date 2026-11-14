/**
 * scroll.ts — scroll an element into view INSIDE its nearest
 * scrollable ancestor only.
 *
 * Why not Element.scrollIntoView? It walks the whole ancestor chain
 * and scrolls every scrollable box it finds — in the framed app shell
 * that can drag intermediate containers (and, when CSS state differs,
 * the document itself), shifting the entire frame after something as
 * small as posting a comment (user report 2026-11-14). This helper
 * centers the element within the ONE container that actually scrolls
 * (the AppShell main column) and touches nothing else.
 */
export function scrollWithinContainer(
  el: HTMLElement | null,
  behavior: ScrollBehavior = "smooth",
): void {
  if (!el) return;
  let container: HTMLElement | null = el.parentElement;
  while (container) {
    const overflowY = getComputedStyle(container).overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      container.scrollHeight > container.clientHeight
    ) {
      break;
    }
    container = container.parentElement;
  }
  if (!container) return;
  const elRect = el.getBoundingClientRect();
  const box = container.getBoundingClientRect();
  const delta =
    elRect.top - box.top - (container.clientHeight - elRect.height) / 2;
  container.scrollTo({ top: container.scrollTop + delta, behavior });
}
