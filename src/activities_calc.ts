// src/activities_calc.ts
import { EventDataStore } from "./event_data_store";
import moment from 'moment';

export class TimeSegment {
    startTime: number;
    endTime: number;
    totalChars: number;
    totalWords: number;
    fileCount: number;

    constructor(startTime: number, endTime: number) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.totalChars = 0;
        this.totalWords = 0;
        this.fileCount = 0;
    }

    addCounts(chars: number, words: number) {
        this.totalChars += chars;
        this.totalWords += words;
    }

    addFileCount(files: number) {
        this.fileCount += files;
    }
}

export class ActivitiesCalc {
    private dataStore: EventDataStore;

    constructor(dataStore: EventDataStore) {
        this.dataStore = dataStore;
    }

    public calculatePeriodStats(periodsStr: [string, string][], isCumulative: boolean, isRelativeToRecent: boolean, periodType: 'const' | 'variable' | 'natural', cutoffTime: number = 0) {
        let [eventRecords, minTime, maxTime] = this.dataStore.getActivities(cutoffTime);
        let segments: TimeSegment[] = [];
    
        // 根据是否是变量时间段，解析时间段字符串或者计算固定时间段
        if (periodType == 'variable') {
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
        } else if (periodType == 'const') {
            // 解析时间段字符串
            const period = this.parseIntervalToMilliseconds(periodsStr[0][0]);

            // 获取能被整除的时间段，需要注意时区偏移
            const timezoneOffsetMinutes = new Date().getTimezoneOffset();
            const timezoneOffsetMilliseconds = timezoneOffsetMinutes * 60 * 1000;
            let startTime = Math.floor((minTime - timezoneOffsetMilliseconds) / period) * period + timezoneOffsetMilliseconds;
            let endTime = Math.ceil((maxTime - timezoneOffsetMilliseconds) / period) * period + timezoneOffsetMilliseconds;
            for (let time = startTime; time < endTime; time += period) {
                segments.push(new TimeSegment(time, time + period));
            }
        } else {                                                // 自然时间段，比如自然周，自然月，自然年
            // periodStr[0][0] 暂时只支持数字+自然时间单位，比如 '1week'，'4month'，'2year'
            const match = periodsStr[0][0].match(/^(\d+)(min|hour|day|week|month|year)$/);
            if (!match) {
                throw new Error('Invalid interval format. Please use formats like 1min, 4week, 2year');
            }
            const amount = parseInt(match[1], 10);
            const unit = match[2];

            // 根据unit计算minTime所处的自然时间段的开始时间
            let startDate: moment.Moment;
            switch (unit) {
                case 'min':
                    startDate = moment(minTime).startOf('minute');
                    break;
                case 'hour':
                    startDate = moment(minTime).startOf('hour');
                    break;
                case 'day':
                    startDate = moment(minTime).startOf('day');
                    break;
                case 'week':
                    startDate = moment(minTime).startOf('isoWeek');
                    break;
                case 'month':
                    startDate = moment(minTime).startOf('month');
                    break;
                case 'year':
                    startDate = moment(minTime).startOf('year');
                    break;
                default:
                    throw new Error(`Unsupported unit: ${unit}`);
            }

            // 生成时间段
            let currentDate = moment(startDate);
            while (currentDate.toDate().getTime() <= maxTime) {
                let endDate: moment.Moment;

                // 计算时间段结束时间
                switch (unit) {
                    case 'min':
                        endDate = moment(currentDate).add(amount, 'minutes').subtract(1, 'seconds');
                        break;
                    case 'hour':
                        endDate = moment(currentDate).add(amount, 'hours').subtract(1, 'seconds');
                        break;
                    case 'day':
                        endDate = moment(currentDate).add(amount, 'days').subtract(1, 'seconds');
                        break;
                    case 'week':
                        endDate = moment(currentDate).add(amount, 'weeks').subtract(1, 'days');
                        break;
                    case 'month':
                        endDate = moment(currentDate).add(amount, 'months').subtract(1, 'days');
                        break;
                    case 'year':
                        endDate = moment(currentDate).add(amount, 'years').subtract(1, 'days');
                        break;
                }

                // 添加时间段
                segments.push(new TimeSegment(currentDate.toDate().getTime(), endDate.toDate().getTime()));
                currentDate = moment(endDate).add(1, 'seconds');    // 移至下一周期的开始
            }
        }
    
        // 创建和遍历映射
        const lastEventStats: { [fileId: number]: { charCount: number; wordCount: number; fileCount: number } } = {};
        const lastSegmentIndexes: { [fileId: number]: number } = {};

        // 分配事件记录到时间段并更新统计数据
        eventRecords.forEach(fileEvents => {
            let initialChars = 0;                               // 记录每个文件在第一个有效时间段的字符数和词数
            let initialWords = 0;
            let firstSegmentIndex = -1;                         // 记录每个文件在第一个有效时间段的索引
            let lastSegmentIndex = 0;                           // 记录每个文件在最后一个有效时间段的索引
            fileEvents.forEach(event => {
                // 找到适当的时间段
                const segmentIndex = segments.findIndex(seg => event.timestamp > seg.startTime && event.timestamp <= seg.endTime);
                if (segmentIndex < 0) {
                    return;
                }

                // 记录第一个有效时间段的字符数和词数
                if (firstSegmentIndex === -1 && isRelativeToRecent && event.eventType === 'u')
                {
                    initialChars = event.charCount;
                    initialWords = event.wordCount;
                    firstSegmentIndex = segmentIndex;
                }

                // 文件数量统计要累积统计
                if (lastSegmentIndex == 0 && segmentIndex > 0 && event.eventType === 'u') {
                    for (let i = lastSegmentIndex; i < segmentIndex; i++) {
                        segments[i].addFileCount(1);
                    }
                } else {
                    for (let i = lastSegmentIndex; i < segmentIndex; i++) {
                        segments[i].addFileCount(lastEventStats[event.fileId]?.fileCount || 0);
                    }
                }

                // 字数和词数是否要累积统计
                if (isCumulative) {
                    // 初始化或延续之前的统计数据到当前 segment
                    // 对于第一个时间段，如果是更新事件，也需要延续之前的统计数据
                    if (lastSegmentIndex == 0 && segmentIndex > 0 && event.eventType === 'u') {
                        for (let i = lastSegmentIndex; i < segmentIndex; i++) {
                            segments[i].addCounts(event.charCount - initialChars, event.wordCount - initialWords);
                        }
                    } else {
                        for (let i = lastSegmentIndex; i < segmentIndex; i++) {
                            segments[i].addCounts(
                                lastEventStats[event.fileId]?.charCount - initialChars || 0,
                                lastEventStats[event.fileId]?.wordCount - initialWords || 0
                            );
                        }
                    }
                } else {
                    // 需要确保同一个时间段里面的事件只被计算一次
                    if (lastSegmentIndex != segmentIndex) {
                        segments[lastSegmentIndex].addCounts(
                            lastEventStats[event.fileId]?.charCount - initialChars || 0,
                            lastEventStats[event.fileId]?.wordCount - initialWords || 0
                        );
                    }
                }

                // 更新当前事件的统计数据
                lastEventStats[event.fileId] = { charCount: event.charCount, wordCount: event.wordCount, fileCount: event.eventType === 'd' ? 0 : 1 };
                lastSegmentIndex = segmentIndex;
            });

            // 处理最后一个事件的字数和词数的相对偏移
            if (isRelativeToRecent && firstSegmentIndex >= 0) {
                lastEventStats[fileEvents[0].fileId].charCount -= initialChars;
                lastEventStats[fileEvents[0].fileId].wordCount -= initialWords;
            }

            // Track the last index per fileId
            lastSegmentIndexes[fileEvents[0].fileId] = lastSegmentIndex;
        });

        // 确保每个时间段都更新到最新
        Object.keys(lastEventStats).forEach(fileIdString => {
            const fileId = Number(fileIdString);
            const lastSegmentIndex = lastSegmentIndexes[fileId];
            const stats = lastEventStats[fileId];

            // 文件数
            if (lastSegmentIndex >= 0) {
                for (let i = lastSegmentIndex; i < segments.length; i++) {
                    segments[i].addFileCount(stats.fileCount);
                }
            }

            // 字数和词数
            if (isCumulative) {
                if (lastSegmentIndex >= 0) {
                    for (let i = lastSegmentIndex; i < segments.length; i++) {
                        segments[i].addCounts(stats.charCount, stats.wordCount);
                    }
                }
            } else {
                if (lastSegmentIndex >= 0) {
                    segments[lastSegmentIndex].addCounts(stats.charCount, stats.wordCount);
                }
            }
        });
    
        return segments;                                        // 返回填充后的时间段数组
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
