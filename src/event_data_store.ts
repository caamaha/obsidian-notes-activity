// event_data_store.ts
import { Vault, TFile } from 'obsidian';
import { FileRecord } from './file_monitor';
import { EventRecord } from './record_datatype';
import { TextAnalyzer } from './text_analyzer';
import Database from '@aidenlx/better-sqlite3';

const binaryPath = "C:\\Users\\Administrator\\AppData\\Roaming\\obsidian\\better-sqlite3-8.0.1-mod.1.node";

export class EventDataStore {
    private vault: Vault;
    private db: any;
    public storeRecords: FileRecord[] = [];

    constructor(vault: Vault, dbPath: string) {
        this.vault = vault;

        console.log('Database initialized at:', dbPath);
        
        // 打开或创建数据库
        this.db = new Database(dbPath, { nativeBinding: binaryPath, fileMustExist: false });
        this.createTables();
        this.loadFileRecords();
    }

    close() {
        this.db.close();
        console.log('Database connection closed.');
    }

    private createTables() {
        const createFileRecordsTable = `
            CREATE TABLE IF NOT EXISTS file_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filePath TEXT NOT NULL UNIQUE,
                fileName TEXT NOT NULL,
                fileType TEXT NOT NULL,
                wordCount INTEGER,
                charCount INTEGER,
                fileSize INTEGER,
                fileExists INTEGER,
                lastModified INTEGER,
                createdAt INTEGER,
                lastChecked INTEGER
            );
        `;
        this.db.prepare(createFileRecordsTable).run();

        // 创建 note_events 表
        const createNoteEventsTable = `
            CREATE TABLE IF NOT EXISTS note_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fileId INTEGER NOT NULL,
                eventType TEXT NOT NULL,
                dstPath TEXT,
                charCount INTEGER,
                wordCount INTEGER,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (fileId) REFERENCES file_records(id)
            );
        `;
        this.db.prepare(createNoteEventsTable).run();
    }

    // 从数据库加载文件记录
    private loadFileRecords() {
        const query = 'SELECT * FROM file_records;';
        const rows = this.db.prepare(query).all();
        this.storeRecords = rows.map((row: any) => new FileRecord(row));
    }

    // 创建或更新内存中的记录
    private updateRecordInMemory(record: FileRecord) {
        const index = this.storeRecords.findIndex(r => r.filePath === record.filePath);
        if (index >= 0) {
            this.storeRecords[index] = record;
        } else {
            this.storeRecords.push(record);
        }
    }

    // 创建或更新数据库中的记录
    updateFileRecord(record: FileRecord) {
        const existingRecord = this.storeRecords.find(r => r.filePath === record.filePath);

        console.log('Updating record:', record.filePath, existingRecord ? 'exists' : 'new')

        if (existingRecord) {
            // Update both in database and memory
            const queryUpdate = `
                UPDATE file_records SET
                fileName = ?, fileType = ?, wordCount = ?, charCount = ?, fileSize = ?, fileExists = ?,
                lastModified = ?, createdAt = ?, lastChecked = ?
                WHERE filePath = ?;
            `;
            this.db.prepare(queryUpdate).run(
                record.fileName, record.fileType, record.wordCount, record.charCount, record.fileSize, record.fileExists ? 1 : 0,
                record.lastModified, record.createdAt, new Date().getTime(),
                record.filePath
            );
            this.updateRecordInMemory(record);
        } else {
            // Insert new record into both database and memory
            const queryInsert = `
                INSERT INTO file_records (filePath, fileName, fileType, wordCount, charCount, fileSize, fileExists, lastModified, createdAt, lastChecked)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            this.db.prepare(queryInsert).run(
                record.filePath, record.fileName, record.fileType, record.wordCount, record.charCount, record.fileSize, record.fileExists ? 1 : 0,
                record.lastModified, record.createdAt, new Date().getTime()
            );
            record.id = this.db.lastInsertRowid;
            this.updateRecordInMemory(record);
        }
    }

    public addEventRecord(event: EventRecord): void {
        const existingRecord = this.storeRecords.find(r => r.id === event.fileId);

        if (!existingRecord && event.eventType === 'c') {
            const file = this.vault.getAbstractFileByPath(event.dstPath);
            if (file && file instanceof TFile) {
                this.updateFileRecord(new FileRecord({
                    filePath: event.fileId,
                    fileName: file.name,
                    fileType: file.extension,
                    wordCount: event.wordCount,
                    charCount: event.charCount,
                    fileSize: file.stat.size,
                    fileExists: true,
                    lastModified: file.stat.mtime,
                    createdAt: file.stat.ctime,
                    lastChecked: new Date().getTime()
                }));
            }
        }

        const insertSql = `
            INSERT INTO note_events (fileId, eventType, dstPath, charCount, wordCount, timestamp)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const stmt = this.db.prepare(insertSql);
        stmt.run(event.fileId, event.eventType, event.dstPath, event.charCount, event.wordCount, event.timestamp);
    }

    public getFilePathById(fileId: number): string | null {
        const record = this.storeRecords.find(record => record.id === fileId);
        if (record) {
            return record.filePath;
        } else {
            return null; // 或者抛出一个错误，如果您希望明确指出查找失败
        }
    }
    
    public getFileIdByPath(filePath: string): number {
        let record = this.storeRecords.find(r => r.filePath === filePath);
        if (record) {
            return record.id;    
        }
        else
        {
            return -1;
        }
    }
}
