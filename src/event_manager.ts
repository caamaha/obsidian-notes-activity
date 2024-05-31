// src/event_aggregator.ts
import { Vault, TFile } from 'obsidian';
import { EventRecord } from "./record_datatype";
import { EventDataStore } from "./event_data_store";
import { TextAnalyzer } from "./text_analyzer";

export class EventManager {
    private vault: Vault;
    private dataStore: EventDataStore;
    private modifyTimers: Map<number, NodeJS.Timeout>;
    private modifyTimeout = 10000;                              // 修改事件的超时触发时间

    constructor(vault: Vault, dataStore: EventDataStore) {
        this.vault = vault;
        this.dataStore = dataStore;
        this.modifyTimers = new Map();
    }

    public handleUpdateEventByFilePath(filePath: string, timestamp: Date): void {
        const fileId = this.dataStore.getFileIdByPath(filePath);
        
        if (fileId != null)
        {
            this.handleUpdateEvent(fileId, timestamp);
        }
        else
        {
            console.error(`File id not found for file path ${filePath}`);
        }
    }

    public handleUpdateEvent(fileId: number, timestamp: Date): void {
        console.log(`UpdateEvent:`, this.dataStore.getFilePathById(fileId), timestamp);

        // 如果已存在计时器，先清除
        if (this.modifyTimers.has(fileId)) {
            clearTimeout(this.modifyTimers.get(fileId));
        }

        // 设置新的计时器
        const timer = setTimeout(() => {
            this.handleUpdateTimeout(fileId, timestamp);
        }, this.modifyTimeout);

        this.modifyTimers.set(fileId, timer);
    }

    private handleUpdateTimeout(fileId: number, timestamp: Date): void {
        const filePath = this.dataStore.getFilePathById(fileId);
        console.log(`Handling modification timeout for ${filePath}`);

        if (filePath == null)
        {
            console.error(`File path not found for file id ${fileId}`);
            return;
        }

        // 处理延时后的笔记修改，如计算字数和词数变化
        const file = this.vault.getAbstractFileByPath(filePath);
        if (file && file instanceof TFile && file.extension === 'md') {
            this.vault.cachedRead(file).then(content => {
                const { charCount, wordCount } = TextAnalyzer.analyzeText(content);
                const event: EventRecord = {
                    fileId: fileId,
                    dstPath: '',
                    eventType: 'u',
                    charCount: charCount,
                    wordCount: wordCount,
                    timestamp: timestamp.getTime()
                };
                this.dataStore.addEventRecord(event);
            });
        }

        // 清除计时器记录
        this.modifyTimers.delete(fileId);
    }

    // 资源清理，如应用关闭时调用
    public clearAllTimers(): void {
        this.modifyTimers.forEach(timer => clearTimeout(timer));
        this.modifyTimers.clear();
    }
}
