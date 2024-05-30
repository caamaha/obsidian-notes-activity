// src/file_monitor.ts
import { Vault, TFile } from 'obsidian';
import { TextAnalyzer } from './text_analyzer';
import { EventDataStore } from './event_data_store';

export class FileRecord {
    id: number;                 // 唯一标识符，可以用于追踪和更新记录
    filePath: string;           // 文件的完整路径
    fileName: string;           // 文件名
    fileType: string;           // 文件类型（如 .md, .pdf 等）
    wordCount: number;          // 文件的单词数（适用于文本文件）
    charCount: number;          // 文件的字符数（适用于文本文件）
    fileSize: number;           // 文件大小，以字节为单位
    fileExists: boolean;        // 文件是否存在
    lastModified: Date;         // 最后修改时间
    createdAt: Date;            // 文件创建时间
    lastChecked: Date;          // 最后一次检查（扫描）时间

    constructor(data: any) {
        this.id = data.id;
        this.filePath = data.filePath;
        this.fileName = data.fileName;
        this.fileType = data.fileType;
        this.wordCount = data.wordCount;
        this.charCount = data.charCount;
        this.fileSize = data.fileSize;
        this.fileExists = data.fileExists == 1;
        this.lastModified = new Date(data.lastModified);
        this.createdAt = new Date(data.createdAt);
        this.lastChecked = new Date(data.lastChecked);
    }
}

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
                const fileModified = new Date(file.stat.mtime);
                if (fileModified > record.lastModified) {
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
        existingRecord.lastModified = new Date(file.stat.mtime);
        existingRecord.lastChecked = new Date();
        existingRecord.wordCount = wordCount;
        existingRecord.charCount = charCount;

        this.dataStore.updateFileRecord(existingRecord);
    }

    private async addRecordFromFile(file: TFile) {
        const content = await this.vault.cachedRead(file);
        const { charCount, wordCount } = TextAnalyzer.analyzeText(content);

        const newRecord = new FileRecord({
            filePath: file.path,
            fileName: file.name,
            fileType: file.path.split('.').pop() || '',
            wordCount: wordCount,
            charCount: charCount,
            fileSize: file.stat.size,
            fileExists: true,
            lastModified: new Date(file.stat.mtime),
            createdAt: new Date(file.stat.ctime),
            lastChecked: new Date()
        });

        this.dataStore.updateFileRecord(newRecord);
    }

    private markRecordAsDeleted(record: FileRecord) {
        record.fileExists = false;
        this.dataStore.updateFileRecord(record);
    }
}
