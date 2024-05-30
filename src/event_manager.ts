// src/event_aggregator.ts
import { Vault, TFile } from 'obsidian';
import { NoteEvent } from "./event_data_types";
import { EventDataStore } from "./event_data_store";
import { TextAnalyzer } from "./text_analyzer";

export class EventManager {
    private vault: Vault;
    private dataStore: EventDataStore;
    private modifyTimers: Map<string, NodeJS.Timeout>;
    private modifyTimeout = 10000;                              // 修改事件的超时触发时间

    constructor(vault: Vault, dataStore: EventDataStore) {
        this.vault = vault;
        this.dataStore = dataStore;
        this.modifyTimers = new Map();
    }

    public handleUpdateEvent(filePath: string, timestamp: Date): void {
        console.log(`UpdateEvent:`, filePath, timestamp);

        // 如果已存在计时器，先清除
        if (this.modifyTimers.has(filePath)) {
            clearTimeout(this.modifyTimers.get(filePath));
        }

        // 设置新的计时器
        const timer = setTimeout(() => {
            this.handleUpdateTimeout(filePath, timestamp);
        }, this.modifyTimeout);

        this.modifyTimers.set(filePath, timer);
    }

    private handleUpdateTimeout(filePath: string, timestamp: Date): void {
        console.log(`Handling modification timeout for ${filePath}`);

        // 处理延时后的笔记修改，如计算字数和词数变化
        const file = this.vault.getAbstractFileByPath(filePath);
        if (file && file instanceof TFile && file.extension === 'md') {
            this.vault.cachedRead(file).then(content => {
                const { charCount, wordCount } = TextAnalyzer.analyzeText(content);
                const event: NoteEvent = {
                    srcPath: filePath,
                    dstPath: '',
                    eventType: 'u',
                    charCount: charCount,
                    wordCount: wordCount,
                    timestamp: timestamp
                };
                this.dataStore.addEventRecord(event);
            });
        }

        // 清除计时器记录
        this.modifyTimers.delete(filePath);
    }

    // 资源清理，如应用关闭时调用
    public clearAllTimers(): void {
        this.modifyTimers.forEach(timer => clearTimeout(timer));
        this.modifyTimers.clear();
    }
}