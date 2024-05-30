// import BetterSqlite3 from '@aidenlx/better-sqlite3';
import Database from '@aidenlx/better-sqlite3';

// type Database = BetterSqlite3.Database;

export class BetterSQLite3Test {
    private db: any;
    
    constructor() {
        // 创建或打开数据库文件
        // this.db = new Database("test1.sqlite", { nativeBinding: "C:\\Users\\Administrator\\AppData\\Roaming\\obsidian\\better-sqlite3-8.0.1-mod.1.node"});
        // this.createTable();
    }

    createTable() {
        // 创建一个表，如果不存在
        this.db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
        this.insertData();
    }

    insertData() {
        // 插入一些测试数据
        const insert = this.db.prepare('INSERT INTO test (name) VALUES (?)');
        for (let i = 0; i < 5; i++) {
            insert.run(`Name ${i}`);
        }
        this.queryData();
    }

    queryData() {
        // 查询并打印出所有数据
        const query = this.db.prepare('SELECT * FROM test');
        const rows = query.all();
        for (const row of rows) {
            console.log(`ID: ${row.id}, Name: ${row.name}`);
        }
        this.close();
    }

    close() {
        // 关闭数据库连接
        this.db.close();
    }
}
