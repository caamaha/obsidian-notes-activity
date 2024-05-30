// event_data_store.ts
import { FileRecord } from './file_monitor';
import Database from '@aidenlx/better-sqlite3';
import * as fs from 'fs';

const binaryPath = "C:\\Users\\Administrator\\AppData\\Roaming\\obsidian\\better-sqlite3-8.0.1-mod.1.node";

export class EventDataStore {
    private db: any;
    public storeRecords: FileRecord[] = [];

    constructor(dbPath: string) {
        console.log('Database initialized at:', dbPath);
        
        if (!fs.existsSync(dbPath)) {
            // 如果不存在，创建一个新的数据库文件
            this.db = new Database(dbPath, { nativeBinding: binaryPath, fileMustExist: false });
            this.createTables();
        } else {
            // 如果存在，直接打开数据库
            this.db = new Database(dbPath, { nativeBinding: binaryPath, fileMustExist: true });
            this.loadFileRecords();
        }
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

    close() {
        this.db.close();
        console.log('Database connection closed.');
    }
}
