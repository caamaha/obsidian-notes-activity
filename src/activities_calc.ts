import { EventRecord } from "./record_datatype";
import { EventDataStore } from "./event_data_store";

class TimeSegment {
    isCheck: boolean;
    totalChars: number;
    totalWords: number;

    constructor() {
        this.isCheck = false;
        this.totalChars = 0;
        this.totalWords = 0;
    }

    addCounts(chars: number, words: number) {
        this.isCheck = true;
        this.totalChars += chars;
        this.totalWords += words;
    }
}

export class ActivitiesCalc {
    private dataStore: EventDataStore;

    constructor(dataStore: EventDataStore) {
        this.dataStore = dataStore;
    }

    public calculateWordStatsPerPeriod(interval: number): TimeSegment[] {
        const [eventRecords, minTime, maxTime] = this.dataStore.getActivities();

        console.log("Calculating word stats per period...")

        // 将时间范围划分为指定的时间段
        interval = Math.max(interval, 10000);                   // 设置最小间隔
        const segments: TimeSegment[] = [];
        for (let time = minTime; time < maxTime; time += interval) {
            segments.push(new TimeSegment());
        }

        // console.log("minTime:", new Date(minTime), "maxTime:", new Date(maxTime), "interval:", interval);
    
        // 创建和遍历映射
        const lastEventStats: { [fileId: number]: { charCount: number; wordCount: number } } = {};
        const lastSegmentIndexes: { [fileId: number]: number } = {};
    
        eventRecords.forEach(fileEvents => {
            let lastSegmentIndex = 0;
    
            fileEvents.forEach(event => {
                const segmentIndex = Math.floor((event.timestamp - minTime) / interval);
                // 初始化或延续之前的统计数据到当前 segment
                for (let i = lastSegmentIndex; i < segmentIndex; i++) {
                    segments[i].addCounts(
                        lastEventStats[event.fileId]?.charCount || 0,
                        lastEventStats[event.fileId]?.wordCount || 0
                    );
                }
    
                // 更新当前事件的统计数据
                lastEventStats[event.fileId] = { charCount: event.charCount, wordCount: event.wordCount };
                lastSegmentIndex = segmentIndex;
            });

            // Track the last index per fileId
            lastSegmentIndexes[fileEvents[0].fileId] = lastSegmentIndex;
        });

        // 确保每个时间段都更新到最新
        Object.keys(lastEventStats).forEach(fileIdString => {
            const fileId = Number(fileIdString);
            const lastSegmentIndex = lastSegmentIndexes[fileId];
            const stats = lastEventStats[fileId];
            for (let i = lastSegmentIndex; i < segments.length; i++) {
                segments[i].addCounts(stats.charCount, stats.wordCount);
            }
        });

        console.log(segments);
    
        return segments;
    }
}