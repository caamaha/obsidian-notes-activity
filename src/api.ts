import { EventDataStore } from "./event_data_store";
import { ActivitiesCalc } from "./activities_calc";
import { TimeSegment } from "./activities_calc";

class ActivitiesOptions {
    periodsStr: [string, string][];
    recentDuration: string = '0min';
    chartTypes: Array<'chars' | 'words'> = ['chars', 'words'];
    isCumulative: boolean = true;
    isRelativeToRecent: boolean = false;
    periodType: 'const' | 'variable' = 'variable';
    pointRadius: number = 0;
    scales: any | undefined;

    constructor(
        periodsStr: [string, string][],
        recentDuration: string = '0min',
        chartTypes: Array<'chars' | 'words'> = ['chars', 'words'],
        isCumulative: boolean = true,
        isRelativeToRecent: boolean = false,
        periodType: 'const' | 'variable' = 'variable',
        pointRadius: number = 0,
        scales: any | undefined = undefined
    ) {
        this.periodsStr = periodsStr;
        this.recentDuration = recentDuration;
        this.chartTypes = chartTypes;
        this.isCumulative = isCumulative;
        this.isRelativeToRecent = isRelativeToRecent;
        this.periodType = periodType;
        this.pointRadius = pointRadius;
        this.scales = scales;
    }
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

        let segments;
        
        if (options.periodType === 'variable') {
            segments = this.activitiesCalc.calculateVariablePeriodStats(options.periodsStr, options.isCumulative, cutoffTime);
        }
        else {
            segments = this.activitiesCalc.calculateConstPeriodStats(options.periodsStr[0][0], options.isCumulative, cutoffTime);
        }

        // 处理相对偏移
        if (options.isCumulative && options.isRelativeToRecent && durationMillis > 0 && segments.length > 0) {
            const initialChars = segments[0].totalChars;
            const initialWords = segments[0].totalWords;
            for (let i = 0; i < segments.length; i++) {
                segments[i].totalChars -= initialChars;
                segments[i].totalWords -= initialWords;
            }
        }

        const labels = segments.map(segment => new Date(segment.endTime));
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
