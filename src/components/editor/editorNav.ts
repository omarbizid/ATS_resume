import type { SectionKey } from '../../types';

/** A panel in the editor column that other parts of the app can open and scroll to. */
export type EditorTarget = 'design' | 'personal' | SectionKey;

const EVENT = 'cv:open-editor-section';

export function openEditorSection(target: EditorTarget) {
    window.dispatchEvent(new CustomEvent<EditorTarget>(EVENT, { detail: target }));
}

export function onOpenEditorSection(handler: (target: EditorTarget) => void) {
    const listener = (e: Event) => handler((e as CustomEvent<EditorTarget>).detail);
    window.addEventListener(EVENT, listener);
    return () => window.removeEventListener(EVENT, listener);
}
