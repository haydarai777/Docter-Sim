/**
 * Helper DOM super kecil (pengganti framework UI).
 *
 *   h('button', { class: 'btn', onclick: () => ... }, 'Teks')
 *
 * - `class`  → className
 * - `on*`    → event listener (onclick, oninput, ...)
 * - boolean  → atribut ada/tidak (disabled, hidden, ...)
 * - lainnya  → setAttribute (aria-*, data-*, title, type, ...)
 * Anak: string/angka/Node/array; null/undefined/false diabaikan.
 */

export type Child = Node | string | number | null | undefined | false | Child[];
type Handler = (event: Event) => void;
export type Props = Record<string, string | number | boolean | Handler | null | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }
  append(el, children);
  return el;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Ganti seluruh isi elemen. */
export function replaceChildren(el: Element, ...children: Child[]): void {
  el.textContent = '';
  append(el, children);
}

/** Gabungkan nama kelas, abaikan nilai falsy. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
