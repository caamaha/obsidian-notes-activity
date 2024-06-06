// src/log.ts
import { Notice } from 'obsidian';
import { FileRecord, EventType } from './record_data_types';

class Log
{
    public static readonly instance: Log = new Log();

    private constructor() {}

    public noticeFileOps(fileRecord: FileRecord, existRecord: FileRecord | undefined, eventType: EventType)
    {
        switch (eventType)
        {
            case 'c':
                this.notice(`File created: ${fileRecord.filePath}`);
                break;
            case 'd':
                this.notice(`File deleted: ${fileRecord.filePath}`);
                break;
            case 'r':
                this.notice(`File renamed: from ${fileRecord.filePath} to ${existRecord?.filePath}`);
                break;
            case 'u':
                this.notice(`File modified: ${fileRecord.filePath} ${fileRecord.charCount} chars, ${fileRecord.wordCount} words`);
                break;
            default:
                break;
        }
    }

    public notice(message: string, duration: number = 3000): void
    {
        new Notice(message, duration);
    }
}

export default Log.instance;
