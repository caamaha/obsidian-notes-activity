// src/file_monitor.ts
import { Vault, TFile } from 'obsidian';
import { TextAnalyzer } from './text_analyzer';
import { EventDataStore } from './event_data_store';
import { FileRecord } from './record_datatype';
import { EventManager } from './event_manager';

export class FileMonitor {
    private vault: Vault;
    private dataStore: EventDataStore;
    private eventManager: EventManager;

    constructor(vault: Vault, dataStore: EventDataStore, eventManager: EventManager) {
        this.vault = vault;
        this.dataStore = dataStore;
        this.eventManager = eventManager;
    }

    async init() {
        console.log("Initializing File Monitor...");

        // 从数据库获取所有记录
        const storedRecords = this.dataStore.fileRecords;
        const storedRecordMap = new Map(storedRecords.map(record => [record.filePath, record]));

        // 获取当前磁盘中的所有文件
        const currentFiles = this.vault.getFiles();
        const currentFilesMap = new Map(currentFiles.map(file => [file.path, file]));

        // 检查和更新当前文件与数据库记录
        for (const file of currentFiles) {
            const record = storedRecordMap.get(file.path);
            if (record) {
                // 检查文件是否更新过
                if (file.stat.mtime > record.lastModified) {
                    // 更新记录
                    this.eventManager.handleFileOps(file.path, 'u');
                }
            } else {
                // 新文件，添加记录
                this.eventManager.handleFileOps(file.path, 'c');
            }
        }

        // 标记已删除的文件
        for (const record of storedRecords) {
            if (!currentFilesMap.has(record.filePath)) {
                this.eventManager.handleFileOps(record.filePath, 'd');
            }
        }
    }
}
