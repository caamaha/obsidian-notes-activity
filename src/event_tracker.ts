// src/event_tracker.ts
import { EventManager } from './event_manager';

export class EventTracker {
    private eventManager: EventManager;

    constructor(eventManager: EventManager) {
        this.eventManager = eventManager;
    }

    public handleFileModify(path: string): void
    {
        this.eventManager.handleUpdateEventByFilePath(path);
    }

    public handleFileRename(newPath: string, oldPath: string): void
    {
        this.eventManager.handleRenameEventByFilePath(newPath, oldPath);
    }

    public handleFileCreate(path: string): void
    {
        this.eventManager.handleFileOps(path, 'c');
    }

    public handleFileDelete(path: string): void
    {
        this.eventManager.handleFileOps(path, 'd');
    }
}
