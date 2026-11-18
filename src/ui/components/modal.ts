import { type Child, h } from '../dom';

export interface ModalOptions {
  title: string;
  body: Child;
  actions: Child;
  onClose: () => void;
  wide?: boolean;
}

/**
 * Dialog modal sederhana. Tutup dengan Esc atau klik latar.
 * Tombol dengan atribut data-autofocus akan difokuskan setelah render.
 */
export function modal(opts: ModalOptions): HTMLElement {
  const titleId = `modal-${Math.random().toString(36).slice(2, 8)}`;
  return h(
    'div',
    { class: 'modal-backdrop', onclick: (e: Event) => e.target === e.currentTarget && opts.onClose() },
    h(
      'div',
      {
        class: `modal${opts.wide ? ' modal--wide' : ''}`,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        onkeydown: (e: Event) => (e as KeyboardEvent).key === 'Escape' && opts.onClose(),
      },
      h(
        'header',
        { class: 'modal__head' },
        h('h2', { id: titleId }, opts.title),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Tutup', onclick: () => opts.onClose() }, '✕'),
      ),
      h('div', { class: 'modal__body' }, opts.body),
      h('div', { class: 'modal__actions' }, opts.actions),
    ),
  );
}
