import { EventRecord } from "./record_datatype";
import { EventDataStore } from "./event_data_store";

export class TimeSegment {
    startTime: number;
    endTime: number;
    totalChars: number;
    totalWords: number;

    constructor(startTime: number, endTime: number) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.totalChars = 0;
        this.totalWords = 0;
    }

    addCounts(chars: number, words: number) {
        this.totalChars += chars;
        this.totalWords += words;
    }
}

export class ActivitiesCalc {
    private dataStore: EventDataStore;

    constructor(dataStore: EventDataStore) {
        this.dataStore = dataStore;
    }

    public calculateWordStatsPerPeriod(interval: number): [TimeSegment[], number, number] {
        let [eventRecords, minTime, maxTime] = this.dataStore.getActivities(0);

        // 将时间范围划分为指定的时间段
        interval = Math.max(interval, 10000);                   // 设置最小间隔

        const segments: TimeSegment[] = [];
        for (let time = minTime; time < maxTime; time += interval) {
            segments.push(new TimeSegment(time, time + interval));
        }
    
        // 创建和遍历映射
        const lastEventStats: { [fileId: number]: { charCount: number; wordCount: number } } = {};
        const lastSegmentIndexes: { [fileId: number]: number } = {};
    
        eventRecords.forEach(fileEvents => {
            let lastSegmentIndex = 0;
    
            fileEvents.forEach(event => {
                const segmentIndex = Math.floor((event.timestamp - minTime) / interval);
                // 初始化或延续之前的统计数据到当前 segment
                // TODO: 不延续统计就是统计增量，延续统计就是统计累计
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
    
        return [segments, minTime, maxTime];
    }

    public calculateVariablePeriodStats(periodsStr: [string, string][], cutoffTime: number = 0) {
        let [eventRecords, minTime, maxTime] = this.dataStore.getActivities(cutoffTime);
        let segments: TimeSegment[] = [];

        // console.log(new Date(minTime), new Date(maxTime));
    
        // 解析时间段字符串
        const periods: [number, number][] = [];
        periodsStr.forEach((periodsStr) => {
            periods.push([this.parseIntervalToMilliseconds(periodsStr[0]), this.parseIntervalToMilliseconds(periodsStr[1])]);
        });

        // 构建时间段
        for (let i = periods.length - 1; i >= 0; i--)
        {
            const interval = periods[i][0];
            const start = (i == 0 ? minTime - interval : maxTime - periods[i - 1][1]);
            const end = maxTime - periods[i][1];

            for (let time = end; time >= start + interval; time -= interval) {
                segments.push(new TimeSegment(time - interval, time));
            }
        }

        segments.reverse();
        segments = segments.filter(segment => segment.startTime >= cutoffTime);
    
        // 创建和遍历映射
        const lastEventStats: { [fileId: number]: { charCount: number; wordCount: number } } = {};
        const lastSegmentIndexes: { [fileId: number]: number } = {};
    
        // 分配事件记录到时间段并更新统计数据
        eventRecords.forEach(fileEvents => {
            let lastSegmentIndex = 0;
            fileEvents.forEach(event => {
                // 找到适当的时间段
                const segmentIndex = segments.findIndex(seg => event.timestamp > seg.startTime && event.timestamp <= seg.endTime);
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

            if (lastSegmentIndex >= 0)
            {
                for (let i = lastSegmentIndex; i < segments.length; i++) {
                    segments[i].addCounts(stats.charCount, stats.wordCount);
                }
            }
        });
    
        return segments; // 返回填充后的时间段数组
    }    

    public parseIntervalToMilliseconds(intervalStr: string): number {
        const units = {
            min: 60000,
            hour: 3600000,
            day: 86400000,
            week: 604800000
        };
        const match = intervalStr.match(/^(\d+)(min|hour|day|week)$/);
        if (!match) {
            throw new Error('Invalid interval format, currently only supports string like 1min, 2hour, 5day, 4week');
        }
        const value = parseInt(match[1], 10);
        const unit = match[2] as keyof typeof units;
        return value * units[unit];
    }
}