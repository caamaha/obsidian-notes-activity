// src/event_aggregator.ts
import { Vault, TFile } from 'obsidian';
import { FileRecord, EventRecord, EventType } from "./record_datatype";
import { EventDataStore } from "./event_data_store";
import { TextAnalyzer } from "./text_analyzer";

export class EventManager {
    private vault: Vault;
    private dataStore: EventDataStore;
    private modifyTimers: Map<number, NodeJS.Timeout>;
    private modifyTimeout = 5000;                              // 修改事件的超时触发时间

    constructor(vault: Vault, dataStore: EventDataStore) {
        this.vault = vault;
        this.dataStore = dataStore;
        this.modifyTimers = new Map();
    }

    public handleFileOps(filePath: string, eventType: EventType): void
    {
        // console.log(`FileOps:`, filePath, eventType);
        if (eventType === 'c' ||
            eventType === 'u' ||
            eventType === 'r')
        {
            const file = this.vault.getAbstractFileByPath(filePath) as TFile;

            if (!file) {
                console.error(`File not found: ${filePath}`);
                return;
            }

            if (file.extension !== 'md') {
                return;
            }
    
            this.vault.cachedRead(file).then(content => {
                const { charCount, wordCount } = TextAnalyzer.analyzeText(content);
                const fileRecord = new FileRecord({
                    id: 0,
                    filePath: file.path,
                    fileName: file.name,
                    fileType: file.extension,
                    charCount: charCount,
                    wordCount: wordCount,
                    fileSize: file.stat.size,
                    fileExists: true,
                    lastModified: file.stat.mtime,
                    createdAt: file.stat.ctime,
                    lastChecked: new Date().getTime()
                });
                this.dataStore.handleFileOps(fileRecord, eventType);
            });
        } else if (eventType === 'd') {
            const fileRecord = new FileRecord();
            fileRecord.filePath = filePath;
            
            this.dataStore.handleFileOps(fileRecord, eventType);
        }
    }

    public handleUpdateEventByFilePath(filePath: string): void {
        const fileId = this.dataStore.getFileIdByPath(filePath);
        
        if (fileId != null)
        {
            // 如果已存在计时器，先清除
            if (this.modifyTimers.has(fileId)) {
                clearTimeout(this.modifyTimers.get(fileId));
            }

            // 设置新的计时器
            const timer = setTimeout(() => {
                this.handleUpdateTimeout(fileId, new Date());
            }, this.modifyTimeout);

            this.modifyTimers.set(fileId, timer);
        }
        else
        {
            console.error(`File id not found for file path ${filePath}`);
        }
    }

    private handleUpdateTimeout(fileId: number, timestamp: Date): void {
        const filePath = this.dataStore.getFilePathById(fileId);
        // console.log(`Handling modification timeout for ${filePath}`, timestamp);

        if (filePath == null)
        {
            console.error(`File path not found for file id ${fileId}`);
            return;
        }

        // 处理延时后的笔记修改，如计算字数和词数变化
        const file = this.vault.getAbstractFileByPath(filePath);
        if (file && file instanceof TFile) {
            this.vault.cachedRead(file).then(content => {
                const { charCount, wordCount } = TextAnalyzer.analyzeText(content);
                const fileRecord = new FileRecord({
                    id: fileId,
                    filePath: file.path,
                    fileName: file.name,
                    fileType: file.extension,
                    charCount: charCount,
                    wordCount: wordCount,
                    fileSize: file.stat.size,
                    fileExists: true,
                    lastModified: file.stat.mtime,
                    createdAt: file.stat.ctime,
                    lastChecked: timestamp.getTime()
                });

                this.dataStore.handleFileOps(fileRecord, 'u')
            });
        }

        // 清除计时器记录
        this.modifyTimers.delete(fileId);
    }

    public handleRenameEventByFilePath(newPath: string, oldPath: string): void {
        const fileId = this.dataStore.getFileIdByPath(oldPath);
        if (fileId != null)
        {
            const file = this.vault.getAbstractFileByPath(newPath);
            const oldRecord = this.dataStore.getFileRecordById(fileId);

            if (file && file instanceof TFile && oldRecord != null)
            {
                const newRecord = new FileRecord({
                    id: fileId,
                    filePath: file.path,
                    fileName: file.name,
                    fileType: file.extension,
                    charCount: oldRecord.charCount,
                    wordCount: oldRecord.wordCount,
                    fileSize: file.stat.size,
                    fileExists: true,
                    lastModified: file.stat.mtime,
                    createdAt: file.stat.ctime,
                    lastChecked: new Date().getTime()
                });

                this.dataStore.handleFileOps(newRecord, 'r')
            }
        }
        else
        {
            console.error(`File id not found for file path ${oldPath}`);
        }
    }

    // 资源清理，如应用关闭时调用
    public clearAllTimers(): void {
        this.modifyTimers.forEach(timer => clearTimeout(timer));
        this.modifyTimers.clear();
    }
}
