// main.ts
import { App, Plugin } from 'obsidian';
import { EventDataStore } from './src/event_data_store';
import { EventTracker } from './src/event_tracker';
import { FileMonitor } from './src/file_monitor';

export default class NoteActivityPlugin extends Plugin {
    private eventDataStore: EventDataStore;
    private eventTracker: EventTracker;
    private fileMonitor: FileMonitor;

    async onload() {
        console.log('\nLoading Note Activity Plugin...');

        this.initDatabase();

        this.eventTracker = new EventTracker(this.app.workspace);
        this.fileMonitor = new FileMonitor(this.app.vault, this.eventDataStore);

        this.app.workspace.onLayoutReady(async () => {
            await this.fileMonitor.init();
            this.registerEditorExtension(this.eventTracker.getUpdateListener());
        });
    }

    onunload() {
        console.log('Unloading Note Activity Plugin...');

        if (this.eventDataStore) {
            this.eventDataStore.close();
        }
    }

    private initDatabase() {
        const dbPath = (this.app.vault.adapter as any).basePath + "/.obsidian/note_activity.db";
        this.eventDataStore = new EventDataStore(dbPath);
    }
}
