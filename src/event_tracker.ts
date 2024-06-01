// src/event_tracker.ts
import { TFile, Workspace } from 'obsidian';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { EventManager } from './event_manager';

export class EventTracker {
    private workspace: Workspace;
    private eventManager: EventManager;

    constructor(workspace: Workspace, eventManager: EventManager) {
        this.workspace = workspace;
        this.eventManager = eventManager;
    }

    public handleFileModify(path: string): void
    {
        console.log(path + ' modified');
        this.eventManager.handleUpdateEventByFilePath(path);
    }

    public handleFileRename(newPath: string, oldPath: string): void
    {
        console.log(oldPath + ' renamed to ' + newPath);
        this.eventManager.handleRenameEventByFilePath(newPath, oldPath);
    }
}
