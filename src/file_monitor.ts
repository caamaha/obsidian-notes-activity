// src/file_monitor.ts
import { Vault, TFile } from 'obsidian';
import { TextAnalyzer } from './text_analyzer';
import { EventDataStore } from './event_data_store';



export class FileMonitor {
    private vault: Vault;
    private dataStore: EventDataStore;

    constructor(vault: Vault, dataStore: EventDataStore) {
        this.vault = vault;
        this.dataStore = dataStore;
    }

    async init() {
        console.log("Initializing File Monitor...");

        // 从数据库获取所有记录
        const storedRecords = this.dataStore.storeRecords;
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
                    await this.updateRecordFromFile(file, record);
                }
            } else {
                // 新文件，添加记录
                await this.addRecordFromFile(file);
            }
        }

        // 标记已删除的文件
        for (const record of storedRecords) {
            if (!currentFilesMap.has(record.filePath)) {
                this.markRecordAsDeleted(record);
            }
        }
    }

    private async updateRecordFromFile(file: TFile, existingRecord: FileRecord) {
        const content = await this.vault.cachedRead(file);
        const { charCount, wordCount } = TextAnalyzer.analyzeText(content);

        existingRecord.fileSize = file.stat.size;
        existingRecord.fileExists = true;
        existingRecord.lastModified = file.stat.mtime;
        existingRecord.lastChecked = new Date().getTime();
        existingRecord.wordCount = wordCount;
        existingRecord.charCount = charCount;

        this.dataStore.updateFileRecord(existingRecord);
        this.dataStore.addEventRecord({
            fileId: file.path,
            eventType: 'u',
            dstPath: '',
            charCount: charCount,
            wordCount: wordCount,
            timestamp: existingRecord.lastModified
        });
    }

    private async addRecordFromFile(file: TFile) {
        const content = await this.vault.cachedRead(file);
        const { charCount, wordCount } = TextAnalyzer.analyzeText(content);

        const newRecord = new FileRecord({
            filePath: file.path,
            fileName: file.name,
            fileType: file.extension,
            wordCount: wordCount,
            charCount: charCount,
            fileSize: file.stat.size,
            fileExists: true,
            lastModified: file.stat.mtime,
            createdAt: file.stat.ctime,
            lastChecked: new Date().getTime()
        });

        this.dataStore.updateFileRecord(newRecord);
        this.dataStore.addEventRecord({
            fileId: file.path,
            eventType: 'u',
            dstPath: '',
            charCount: charCount,
            wordCount: wordCount,
            timestamp: file.stat.mtime
        });
    }

    private markRecordAsDeleted(record: FileRecord) {
        record.fileExists = false;
        this.dataStore.updateFileRecord(record);
        this.dataStore.addEventRecord({
            fileId: record.filePath,
            eventType: 'd',
            dstPath: '',
            charCount: 0,
            wordCount: 0,
            timestamp: new Date().getTime()
        });
    }
}
