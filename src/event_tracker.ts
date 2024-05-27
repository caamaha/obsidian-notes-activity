// src/event_tracker.ts
import { Plugin } from 'obsidian';
import { EditorView, ViewUpdate } from '@codemirror/view';

export class EventTracker {
    // 返回一个编辑器更新监听器
    getUpdateListener() {
        return EditorView.updateListener.of((update: ViewUpdate) => {
            this.handleEditorUpdate(update);
        });
    }

    private handleEditorUpdate(update: ViewUpdate) {
        const changes = update.changes;
        let added = 0;
        let removed = 0;
        let removedText = '';
        let addedText = '';

        changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            removed += toA - fromA;
            added += inserted.length;
            removedText += update.startState.doc.sliceString(fromA, toA);
            addedText += inserted.toString();
        });

        if (added > 0 || removed > 0) {
            console.log(`Added characters: ${added}, Removed characters: ${removed}`);
            console.log(`Added text: "${addedText}"`);
            console.log(`Removed text: "${removedText}"`);
        }
    }
}
