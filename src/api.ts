// src/api.ts
import { EventDataStore } from "./event_data_store";
import { ActivitiesCalc } from "./activities_calc";

class ActivitiesOptions {
    constructor(
        public periodsStr: [string, string][],
        public recentDuration: string = '0min',
        public chartTypes: Array<'chars' | 'words' | 'files'> = ['chars', 'words', 'files'],
        public isCumulative: boolean = true,
        public isRelativeToRecent: boolean = false,
        public periodType: 'const' | 'variable' | 'natural' = 'variable',
        public pointRadius: number = 0,
        public scales?: any
    ) {}
}

export class Api {
    private dataStore: EventDataStore;
    private activitiesCalc: ActivitiesCalc;

    constructor(dataStore: EventDataStore, activitiesCalc: ActivitiesCalc) {
        this.dataStore = dataStore;
        this.activitiesCalc = activitiesCalc;
    }

    // 解析每个间隔并调用变周期版本的统计方法
    public getActivities(options: ActivitiesOptions): any {
        const durationMillis  = this.activitiesCalc.parseIntervalToMilliseconds(options.recentDuration);

        // 计算截止时间
        const cutoffTime = durationMillis === 0 ? 0 : (new Date().getTime()) - durationMillis;

        // 计算各时间段的统计数据
        const segments = this.activitiesCalc.calculatePeriodStats(options.periodsStr, options.isCumulative, options.isRelativeToRecent, options.periodType, cutoffTime);

        const labels = segments.map(segment => new Date(segment.startTime));
        const datasets = [];

        // 动态添加数据集
        if (options.chartTypes.includes('chars')) {
            datasets.push({
                label: 'Total Characters',
                data: segments.map(segment => segment.totalChars),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                yAxisID: 'y'
            });
        }

        if (options.chartTypes.includes('words')) {
            datasets.push({
                label: 'Total Words',
                data: segments.map(segment => segment.totalWords),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                yAxisID: 'y'
            });
        }

        if (options.chartTypes.includes('files')) {
            datasets.push({
                type: 'line',
                label: 'Total Files',
                data: segments.map(segment => segment.fileCount),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                yAxisID: 'y1'
            });
        }

        // 添加图表选项
        if (options.scales == undefined)
        {
            options.scales = {
                x: {
                    type: 'time',
                    ticks: {
                        maxTicksLimit: 15
                    }
                }
            }
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
                        radius: options.pointRadius
                    }
                },
                animation: false,
                scales: options.scales
            }
        };

        return chartData;
    }
}
