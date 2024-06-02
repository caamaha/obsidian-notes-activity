import { EventDataStore } from "./event_data_store";
import { ActivitiesCalc } from "./activities_calc";

export class Api {
    private dataStore: EventDataStore;
    private activitiesCalc: ActivitiesCalc;

    constructor(dataStore: EventDataStore, activitiesCalc: ActivitiesCalc) {
        this.dataStore = dataStore;
        this.activitiesCalc = activitiesCalc;
    }

    public getActivities(): any {
        return this.dataStore.getActivities();
    }

    public calculateWordStatsPerPeriod(interval: number): any {
        const segments = this.activitiesCalc.calculateWordStatsPerPeriod(interval);

        const labels = segments.map((_, index) => index * interval / 1000);
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
                }]
            }
        };

        return chartData;
    }
}
