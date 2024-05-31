// record_datatype.ts
export class FileRecord {
    id: number;                 // 唯一标识符，可以用于追踪和更新记录
    filePath: string;           // 文件的完整路径
    fileName: string;           // 文件名
    fileType: string;           // 文件类型（如 .md, .pdf 等）
    wordCount: number;          // 文件的单词数（适用于文本文件）
    charCount: number;          // 文件的字符数（适用于文本文件）
    fileSize: number;           // 文件大小，以字节为单位
    fileExists: boolean;        // 文件是否存在
    lastModified: number;       // 最后修改时间，Unix timestamp in milliseconds
    createdAt: number;          // 文件创建时间，Unix timestamp in milliseconds
    lastChecked: number;        // 最后一次检查（扫描）时间，Unix timestamp in milliseconds

    constructor(data: any) {
        this.id = data.id;
        this.filePath = data.filePath;
        this.fileName = data.fileName;
        this.fileType = data.fileType;
        this.wordCount = data.wordCount;
        this.charCount = data.charCount;
        this.fileSize = data.fileSize;
        this.fileExists = data.fileExists == 1;
        this.lastModified = data.lastModified;
        this.createdAt = data.createdAt;
        this.lastChecked = data.lastChecked;
    }
}

export interface EventRecord
{
    fileId: number;                                             // 与 FileRecord 的 id 相关联
    eventType: 'c' | 'd' | 'm' | 'u';                           // 事件类型（创建 c、删除 d、移动 m、修改 u）
    dstPath: string;                                            // 移动的目标路径（仅针对创建和移动事件）
    charCount: number;                                          // 笔记的字符数
    wordCount: number;                                          // 笔记的词数
    timestamp: number;                                          // 事件发生的时间戳，Unix timestamp in milliseconds
}
