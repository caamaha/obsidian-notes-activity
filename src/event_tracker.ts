// src/event_tracker.ts
import { Workspace } from 'obsidian';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { EventManager } from './event_manager';

export class EventTracker {
    private workspace: Workspace;
    private eventManager: EventManager;

    constructor(workspace: Workspace, eventManager: EventManager) {
        this.workspace = workspace;
        this.eventManager = eventManager;
    }

    // 返回一个编辑器更新监听器
    getUpdateListener() {
        return EditorView.updateListener.of((update: ViewUpdate) => {
            this.handleEditorUpdate(update);
        });
    }

    private handleEditorUpdate(update: ViewUpdate) {
        // 获取当前活跃文件的路径
        let filePath = this.workspace.getActiveFile()?.path ?? "";

        if (filePath != "")
        {
            const changes = update.changes;
            let changed = false;

            changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
                // fromA 和 toA 是文本删除的范围，inserted 是插入的文本
                if (fromA != toA || inserted.length > 0)
                {
                    changed = true;
                }
            });
            
            // 构建笔记修改事件
            if (changed)
            {
                this.eventManager.handleUpdateEvent(filePath, new Date());
            }
        }
    }
}
