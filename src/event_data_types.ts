// event_data_types.ts

export interface NoteEvent
{
    srcPath: string;                                            // 笔记文件或文件夹的路径
    eventType: 'c' | 'd' | 'm' | 'u';                           // 事件类型（创建 c、删除 d、移动 m、修改 u）
    dstPath: string;                                            // 移动的目标路径（仅针对移动事件）
    charCount: number;                                          // 笔记的字符数
    wordCount: number;                                          // 笔记的词数
    timestamp: Date;                                            // 事件发生的时间戳
}
