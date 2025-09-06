import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/core';

export interface BibleHighlightOptions {
  onHighlight: (verseId: string, color: string) => void;
  onContextMenu?: (event: MouseEvent, selection: any) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bibleHighlight: {
      highlightVerse: (color: string) => ReturnType;
      applyHighlightColor: (color: string) => ReturnType;
    };
  }
}

export const BibleHighlightExtension = Extension.create<BibleHighlightOptions>({
  name: 'bibleHighlight',

  addOptions() {
    return {
      onHighlight: () => {},
      onContextMenu: undefined,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        key: new PluginKey('bibleHighlight'),
        props: {
          handleDOMEvents: {
            mouseup: (view, event) => {
              const selection = view.state.selection;
              if (selection.empty) return false;

              // Get the selected text and find the verse element
              const { from, to } = selection;
              const selectedText = view.state.doc.textBetween(from, to);
              
              // Find the verse element
              const target = event.target as HTMLElement;
              const verseElement = target.closest('[data-verse-id]');
              
              if (verseElement && selectedText) {
                const verseId = verseElement.getAttribute('data-verse-id');
                if (verseId) {
                  // Store selection info for later use
                  (view as any).lastSelection = {
                    verseId,
                    from,
                    to,
                    text: selectedText,
                    element: verseElement,
                  };
                }
              }
              
              return false;
            },
            contextmenu: (view, event) => {
              event.preventDefault();
              
              const selection = view.state.selection;
              if (!selection.empty) {
                const { from, to } = selection;
                const selectedText = view.state.doc.textBetween(from, to);
                
                // Find the verse element
                const target = event.target as HTMLElement;
                const verseElement = target.closest('[data-verse-id]');
                
                if (verseElement && selectedText) {
                  const verseId = verseElement.getAttribute('data-verse-id');
                  
                  // Check if there's already a highlight
                  const hasHighlight = verseElement.querySelector('mark') !== null;
                  
                  if (extension.options.onContextMenu) {
                    extension.options.onContextMenu(event, {
                      verseId,
                      from,
                      to,
                      text: selectedText,
                      element: verseElement,
                      hasHighlight,
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }
                }
              }
              
              return true;
            },
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      highlightVerse:
        (color: string) =>
        ({ editor }: { editor: Editor }) => {
          const view = editor.view;
          const lastSelection = (view as any).lastSelection;
          
          if (lastSelection) {
            this.options.onHighlight(lastSelection.verseId, color);
          }
          
          return true;
        },
      applyHighlightColor:
        (color: string) =>
        ({ editor, chain }) => {
          return chain()
            .focus()
            .toggleHighlight({ color })
            .run();
        },
    };
  },
});
