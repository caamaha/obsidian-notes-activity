import { EventDataStore } from "./event_data_store";
import { ActivitiesCalc } from "./activities_calc";
import { TimeSegment } from "./activities_calc";

class ActivitiesOptions {
    periodsStr: [string, string][];
    recentDuration: string = '0min';
    chartTypes: Array<'chars' | 'words'> = ['chars', 'words'];
    isCumulative: boolean = true;
    isRelativeToRecent: boolean = false;

    constructor(
        periodsStr: [string, string][],
        recentDuration: string = '0min',
        chartTypes: Array<'chars' | 'words'> = ['chars', 'words'],
        isCumulative: boolean = true,
        isRelativeToRecent: boolean = false
    ) {
        this.periodsStr = periodsStr;
        this.recentDuration = recentDuration;
        this.chartTypes = chartTypes;
        this.isCumulative = isCumulative;
        this.isRelativeToRecent = isRelativeToRecent;
    }
}

export class Api {
    private dataStore: EventDataStore;
    private activitiesCalc: ActivitiesCalc;

    constructor(dataStore: EventDataStore, activitiesCalc: ActivitiesCalc) {
        this.dataStore = dataStore;
        this.activitiesCalc = activitiesCalc;
    }

    public getActivitiesPerPeriod(intervalStr: string): any {
        const interval = this.activitiesCalc.parseIntervalToMilliseconds(intervalStr);
        const [segments, minTime, maxTime] = this.activitiesCalc.calculateWordStatsPerPeriod(interval);

        const labels = segments.map((_, index) => new Date(minTime + index * interval).toLocaleString());
        const charCounts = segments.map(segment => segment.totalChars);
        const wordCounts = segments.map(segment => segment.totalWords);

        const chartData = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Characters',
                    data: charCounts,
                    backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                    borderColor: ['rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                },
                {
                    label: 'Total Words',
                    data: wordCounts,
                    backgroundColor: ['rgba(54, 162, 235, 0.2)'],
                    borderColor: ['rgba(54, 162, 235, 1)'],
                    borderWidth: 1
                }],
            },
            options: {
                elements: {
                    point:{
                        radius: 0
                    }
                }
            },
            scales: {
                x: {
                    type: 'time'
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        };

        return chartData;
    }

    public getActivitiesVariablePeriod(periodsStr: [string, string][], recentDuration: string = '0min'): any {
        // 解析每个间隔并调用变周期版本的统计方法
        let segments = this.activitiesCalc.calculateVariablePeriodStats(periodsStr);
        const durationMillis  = this.activitiesCalc.parseIntervalToMilliseconds(recentDuration);
        const cutoffTime = (new Date().getTime()) - durationMillis; // 计算截止时间

        if (durationMillis != 0)
        {
            segments = segments.filter(segment => segment.startTime >= cutoffTime);
            console.log(segments);
        }

        const labels = segments.map(segment => new Date(segment.startTime).toLocaleString());
        const charCounts = segments.map(segment => segment.totalChars);
        const wordCounts = segments.map(segment => segment.totalWords);

        const chartData = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                    label: 'Total Characters',
                    data: charCounts,
                    backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                    borderColor: ['rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                },
                {
                    label: 'Total Words',
                    data: wordCounts,
                    backgroundColor: ['rgba(54, 162, 235, 0.2)'],
                    borderColor: ['rgba(54, 162, 235, 1)'],
                    borderWidth: 1
                }],
            },
            options: {
                elements: {
                    point:{
                        radius: 0
                    }
                }
            },
            scales: {
                x: {
                    type: 'time'
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        };

        return chartData;
    }

    public getActivities(options: ActivitiesOptions): any {
        // 解析每个间隔并调用变周期版本的统计方法
        let segments = this.activitiesCalc.calculateVariablePeriodStats(options.periodsStr);
        const durationMillis  = this.activitiesCalc.parseIntervalToMilliseconds(options.recentDuration);
        const cutoffTime = (new Date().getTime()) - durationMillis; // 计算截止时间

        if (durationMillis > 0)
        {
            segments = segments.filter(segment => segment.startTime >= cutoffTime);
        }

        // 处理相对偏移
        if (options.isRelativeToRecent && durationMillis > 0 && segments.length > 0) {
            const initialChars = segments[0].totalChars;
            const initialWords = segments[0].totalWords;
            for (let i = 0; i < segments.length; i++) {
                segments[i].totalChars -= initialChars;
                segments[i].totalWords -= initialWords;
            }
        }

        // TODO: 处理增量式统计

        const labels = segments.map(segment => new Date(segment.startTime).toLocaleString());
        const datasets = [];

        // 动态添加数据集
        if (options.chartTypes.includes('chars')) {
            datasets.push({
                label: 'Total Characters',
                data: segments.map(segment => segment.totalChars),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            });
        }
        if (options.chartTypes.includes('words')) {
            datasets.push({
                label: 'Total Words',
                data: segments.map(segment => segment.totalWords),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            });
        }

        const chartData = {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets

            },
            options: {
                elements: {
                    point:{
                        radius: 0
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'll'
                    }
                }
            }
        };

        return chartData;
    }
}
