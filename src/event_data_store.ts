// event_data_store.ts
import { Vault, TFile } from 'obsidian';
import { FileRecord } from './file_monitor';
import { NoteEvent } from './event_data_types';
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
                filePath TEXT NOT NULL,
                fileName TEXT NOT NULL,
                fileType TEXT NOT NULL,
                wordCount INTEGER,
                charCount INTEGER,
                fileSize INTEGER,
                fileExists INTEGER,
                lastModified DATETIME,
                createdAt DATETIME,
                lastChecked DATETIME
            );
        `;
        this.db.prepare(createFileRecordsTable).run();

        // 创建 note_events 表
        const createNoteEventsTable = `
            CREATE TABLE IF NOT EXISTS note_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                srcPath TEXT NOT NULL,
                eventType TEXT NOT NULL,
                dstPath TEXT NOT NULL,
                charCount INTEGER,
                wordCount INTEGER,
                timestamp DATETIME NOT NULL
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
                record.lastModified.toISOString(), record.createdAt.toISOString(), new Date().toISOString(),
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
                record.lastModified.toISOString(), record.createdAt.toISOString(), new Date().toISOString()
            );
            record.id = this.db.lastInsertRowid;
            this.updateRecordInMemory(record);
        }
    }

    public addEventRecord(event: NoteEvent): void {
        const existingRecord = this.storeRecords.find(r => r.filePath === event.srcPath);

        if (!existingRecord) {
            const file = this.vault.getAbstractFileByPath(event.srcPath);
            if (file && file instanceof TFile) {
                this.updateFileRecord(new FileRecord({
                    filePath: event.srcPath,
                    fileName: file.name,
                    fileType: file.extension,
                    wordCount: event.wordCount,
                    charCount: event.charCount,
                    fileSize: file.stat.size,
                    fileExists: true,
                    lastModified: new Date(file.stat.mtime),
                    createdAt: new Date(file.stat.ctime),
                    lastChecked: new Date()
                }));
            }
        }

        const insertSql = `
            INSERT INTO note_events (srcPath, eventType, dstPath, charCount, wordCount, timestamp)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const stmt = this.db.prepare(insertSql);
        stmt.run(event.srcPath, event.eventType, event.dstPath, event.charCount, event.wordCount, event.timestamp.toISOString());
    }
}
