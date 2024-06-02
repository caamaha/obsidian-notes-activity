// main.ts
import { Plugin } from 'obsidian';
import { EventDataStore } from './src/event_data_store';
import { EventTracker } from './src/event_tracker';
import { FileMonitor } from './src/file_monitor';
import { EventManager } from './src/event_manager';
import { Api } from './src/api';
import { ActivitiesCalc } from 'src/activities_calc';

export default class NoteActivityPlugin extends Plugin {
    private eventManager: EventManager;
    private eventDataStore: EventDataStore;
    private eventTracker: EventTracker;
    private fileMonitor: FileMonitor;
    private activitiesCalc: ActivitiesCalc;
    private api: Api;

    async onload() {
        console.log('\nLoading Note Activity Plugin...');

        this.initDatabase();

        this.eventManager = new EventManager(this.app.vault, this.eventDataStore);
        this.eventTracker = new EventTracker(this.eventManager);
        this.fileMonitor = new FileMonitor(this.app.vault, this.eventDataStore, this.eventManager);
        this.activitiesCalc = new ActivitiesCalc(this.eventDataStore);
        this.api = new Api(this.eventDataStore, this.activitiesCalc);

        this.app.workspace.onLayoutReady(async () => {
            this.fileMonitor.init();

            this.registerEvent(this.app.vault.on('create', (file) => {
                this.eventTracker.handleFileCreate(file.path);
            }));
            this.registerEvent(this.app.vault.on('delete', (file) => {
                this.eventTracker.handleFileDelete(file.path);
            }));
            this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
                this.eventTracker.handleFileRename(file.path, oldPath);
            }));
            this.registerEvent(this.app.vault.on('modify', (file) => {
                this.eventTracker.handleFileModify(file.path);
            }));
        });

        // 提供导出数据的接口
        //@ts-ignore
        window.notesActivityApi = this.api;
    }

    onunload() {
        console.log('Unloading Note Activity Plugin...');
        this.eventDataStore.close();
    }

    private initDatabase() {
        const dbPath = (this.app.vault.adapter as any).basePath + "/.obsidian/note_activity.db";
        this.eventDataStore = new EventDataStore(dbPath);
    }
}
