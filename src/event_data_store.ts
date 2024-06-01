// event_data_store.ts
import { Vault, TFile } from 'obsidian';
import { FileRecord, EventRecord, EventType } from './record_datatype';
import { TextAnalyzer } from './text_analyzer';
import Database from '@aidenlx/better-sqlite3';

const binaryPath = "C:\\Users\\Administrator\\AppData\\Roaming\\obsidian\\better-sqlite3-8.0.1-mod.1.node";

export class EventDataStore {
    private vault: Vault;
    private db: any;
    public fileRecords: FileRecord[] = [];

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
        // 创建 fileRecords 表
        const createFileRecordsTable = `
            CREATE TABLE IF NOT EXISTS fileRecords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filePath TEXT NOT NULL UNIQUE,
                fileName TEXT NOT NULL,
                fileType TEXT NOT NULL,
                charCount INTEGER,
                wordCount INTEGER,
                fileSize INTEGER,
                fileExists INTEGER,
                lastModified INTEGER,
                createdAt INTEGER,
                lastChecked INTEGER
            );
        `;
        this.db.prepare(createFileRecordsTable).run();

        // 创建 eventRecords 表
        const createNoteEventsTable = `
            CREATE TABLE IF NOT EXISTS eventRecords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fileId INTEGER NOT NULL,
                eventType TEXT NOT NULL,
                filePath TEXT,
                charCount INTEGER,
                wordCount INTEGER,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (fileId) REFERENCES fileRecords(id)
            );
        `;
        this.db.prepare(createNoteEventsTable).run();
    }

    // 从数据库加载文件记录
    private loadFileRecords() {
        const query = 'SELECT * FROM fileRecords WHERE fileExists = 1;';
        const rows = this.db.prepare(query).all();
        this.fileRecords = rows.map((row: any) => new FileRecord(row));
    }

    public handleFileOps(fileRecord: FileRecord, eventType: EventType): void {
        switch (eventType) {
            case 'c': // 创建
            case 'u': // 更新
                this.updateFileRecord(fileRecord);
                this.addEventRecord_FileOps(fileRecord, eventType);
                break;
            case 'd': // 删除
                this.deleteFileRecord(fileRecord);
                this.addEventRecord_FileOps(fileRecord, eventType);
                break;
            case 'm': // 移动
                // this.moveFileRecord(event);
                break;
            default:
                throw new Error("Unsupported file operation");
        }
    }

    private updateFileRecord(record: FileRecord): void {
        // 创建或更新数据库记录
        const existingRecord = this.fileRecords.find(r => r.filePath === record.filePath);
        if (existingRecord) {
            record.id = existingRecord.id;
            // Update existing record in both database and memory
            const queryUpdate = `
                UPDATE fileRecords SET
                filePath = ?, fileName = ?, fileType = ?, charCount = ?, wordCount = ?, fileSize = ?, fileExists = ?,
                lastModified = ?, createdAt = ?, lastChecked = ?
                WHERE id = ?;
            `;
            this.db.prepare(queryUpdate).run(
                record.filePath, record.fileName, record.fileType, record.charCount, record.wordCount, record.fileSize, record.fileExists ? 1 : 0,
                record.lastModified, record.createdAt, new Date().getTime(),
                record.id
            );
        }
        else
        {
            // Insert new record into both database and memory
            const queryInsert = `
            INSERT INTO fileRecords (filePath, fileName, fileType, charCount, wordCount, fileSize, fileExists, lastModified, createdAt, lastChecked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            this.db.prepare(queryInsert).run(
                record.filePath, record.fileName, record.fileType, record.charCount, record.wordCount, record.fileSize, record.fileExists ? 1 : 0,
                record.lastModified, record.createdAt, new Date().getTime()
            );
            record.id = this.db.lastInsertRowid;
        }

        // 更新内存记录
        const index = this.fileRecords.findIndex(r => r.id === record.id);
        if (index >= 0) {
            this.fileRecords[index] = record;
        } else {
            this.fileRecords.push(record);
        }
    }

    private deleteFileRecord(record: FileRecord): void {
        const index = this.fileRecords.findIndex(r => r.filePath === record.filePath);
        console.log(record.filePath);
        if (index >= 0)
        {
            record.id = this.fileRecords[index].id;

            // 标记数据库文件记录为删除状态
            const queryUpdate = `
            UPDATE fileRecords SET
            charCount = ?, wordCount = ?, fileSize = ?, fileExists = ?,
            lastModified = ?, lastChecked = ?
            WHERE id = ?;
            `;
            const currTime = new Date().getTime();
            this.db.prepare(queryUpdate).run(
                0, 0, 0, 0, currTime, currTime, record.id
            );

            // 删除内存记录
            this.fileRecords.splice(index, 1);
        }
    }

    private moveFileRecord(event: EventRecord): void {
        throw new Error("Method not implemented.");
    //     const updateSql = `UPDATE file_records SET filePath = ?, lastChecked = ? WHERE id = ?`;
    //     this.db.prepare(updateSql).run(event.dstPath, new Date().getTime(), event.fileId);
    }

    public addEventRecord_FileOps(fileRecord: FileRecord, eventType: EventType): void {
        const query = `SELECT * FROM fileRecords WHERE filePath = ?;`;
        const record = this.db.prepare(query).get(fileRecord.filePath);

        if (eventType === 'u')
        {
            record.filePath = '';                               // 为节省数据空间，更新事件不需要记录文件路径
        }

        if (record) {
            const insertSql = `
                INSERT INTO eventRecords (fileId, eventType, filePath, charCount, wordCount, timestamp)
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            const stmt = this.db.prepare(insertSql);
            stmt.run(record.id, eventType, record.filePath, record.charCount, record.wordCount, record.lastModified);
        }
        
    }

    public getFilePathById(fileId: number): string | null {
        const record = this.fileRecords.find(record => record.id === fileId);
        if (record) {
            return record.filePath;
        } else {
            throw new Error(`File ID ${fileId} not found`);
            return null; // 或者抛出一个错误，如果您希望明确指出查找失败
        }
    }
    
    public getFileIdByPath(filePath: string): number {
        let record = this.fileRecords.find(r => r.filePath === filePath);
        if (record) {
            return record.id;    
        }
        else
        {
            throw new Error("File not found" + filePath);
        }
    }
}
