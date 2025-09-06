import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface AIInsightsOptions {
  onTrigger: (selectedText: string, verseContext?: string) => void;
}

export const AIInsightsExtension = Extension.create<AIInsightsOptions>({
  name: 'aiInsights',

  addOptions() {
    return {
      onTrigger: () => {},
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => {
        const { state } = this.editor;
        const { from, to } = state.selection;
        
        if (from === to) return false; // No selection
        
        const selectedText = state.doc.textBetween(from, to);
        
        // Find the verse context
        let verseContext = '';
        const resolved = state.doc.resolve(from);
        const node = resolved.node();
        
        if (node && node.textContent) {
          verseContext = node.textContent;
        }
        
        // Trigger the AI insights
        this.options.onTrigger(selectedText, verseContext);
        
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('aiInsights'),
        props: {
          handleKeyDown: (view, event) => {
            // Alternative way to handle Cmd+U / Ctrl+U
            if ((event.metaKey || event.ctrlKey) && event.key === 'u') {
              event.preventDefault();
              
              const { state } = view;
              const { from, to } = state.selection;
              
              if (from !== to) {
                const selectedText = state.doc.textBetween(from, to);
                
                // Get the full verse context
                const $from = state.doc.resolve(from);
                const $to = state.doc.resolve(to);
                const node = $from.node($from.depth);
                const verseContext = node.textContent || '';
                
                this.options.onTrigger(selectedText, verseContext);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
