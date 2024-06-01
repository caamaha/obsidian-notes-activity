// main.ts
import { App, Plugin } from 'obsidian';
import { EventDataStore } from './src/event_data_store';
import { EventTracker } from './src/event_tracker';
import { FileMonitor } from './src/file_monitor';
import { EventManager } from './src/event_manager';

export default class NoteActivityPlugin extends Plugin {
    private eventManager: EventManager;
    private eventDataStore: EventDataStore;
    private eventTracker: EventTracker;
    private fileMonitor: FileMonitor;

    async onload() {
        console.log('\nLoading Note Activity Plugin...');

        this.initDatabase();

        this.eventManager = new EventManager(this.app.vault, this.eventDataStore);
        this.eventTracker = new EventTracker(this.app.workspace, this.eventManager);
        this.fileMonitor = new FileMonitor(this.app.vault, this.eventDataStore, this.eventManager);

        this.app.workspace.onLayoutReady(async () => {
            this.fileMonitor.init();
            this.registerEditorExtension(this.eventTracker.getUpdateListener());
        });
    }

    onunload() {
        console.log('Unloading Note Activity Plugin...');
        this.fileMonitor.tearDown();
        this.eventDataStore.close();
    }

    private initDatabase() {
        const dbPath = (this.app.vault.adapter as any).basePath + "/.obsidian/note_activity.db";
        this.eventDataStore = new EventDataStore(this.app.vault, dbPath);
    }
}
