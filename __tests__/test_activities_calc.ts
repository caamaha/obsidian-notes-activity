// test/test_activities_calc.ts
import { ActivitiesCalc } from '../src/activities_calc';
import { EventRecord } from '../src/record_data_types';
import moment from 'moment';

// 定义每个测试案例的数据，包括模拟的返回值
const testCases = [
    {
        description: "累积式不减去初值1",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'c' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 0, wordCount: 0, eventType: 'd' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 100, 100, 110, 110, 90, 90, 0, 0]
    },
    {
        description: "累积式不减去初值2",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 0, wordCount: 0, eventType: 'd' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [100, 100, 100, 100, 110, 110, 90, 90, 0, 0]
    },
    {
        description: "累积式不减去初值3",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 20, wordCount: 10, eventType: 'u' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [100, 100, 100, 100, 110, 110, 90, 90, 10, 10]
    },
    {
        description: "累积式不减去初值4",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 0, eventType: 'd' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 20, wordCount: 10, eventType: 'c' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [100, 100, 100, 100, 0, 0, 90, 90, 10, 10]
    },
    {
        description: "累积式减去初值1",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'c' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 0, wordCount: 0, eventType: 'd' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: true,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 100, 100, 110, 110, 90, 90, 0, 0]
    },
    {
        description: "累积式减去初值2",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 0, wordCount: 0, eventType: 'd' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: true,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 0, 0, 10, 10, -10, -10, 0, 0]
    },
    {
        description: "累积式减去初值3",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 20, wordCount: 10, eventType: 'u' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: true,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 0, 0, 10, 10, -10, -10, -90, -90]
    },
    {
        description: "累积式减去初值4",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 0, eventType: 'd' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 20, wordCount: 10, eventType: 'c' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: true,
        isRelativeToRecent: true,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 0, 0, 0, 0, 90, 90, 10, 10]
    },
    {
        description: "增量式1",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'c' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 0, wordCount: 0, eventType: 'd' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: false,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 100, 0, 10, 0, -20, 0, -90, 0]
    },
    {
        description: "增量式2",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 0, wordCount: 0, eventType: 'd' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: false,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 0, 0, 10, 0, -20, 0, -90, 0]
    },
    {
        description: "增量式3",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 110, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 20, wordCount: 10, eventType: 'u' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: false,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 0, 0, 10, 0, -20, 0, -80, 0]
    },
    {
        description: "增量式4",
        getActivitiesReturn: [
            [
                [
                    { fileId: 1, timestamp: moment("2024-06-06T12:02:01").valueOf(), charCount: 200, wordCount: 100, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:04:01").valueOf(), charCount: 220, wordCount: 0, eventType: 'd' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:06:01").valueOf(), charCount: 180, wordCount: 90, eventType: 'u' },
                    { fileId: 1, timestamp: moment("2024-06-06T12:08:01").valueOf(), charCount: 20, wordCount: 10, eventType: 'c' },
                ]
            ],
            moment("2024-06-06T12:00:00").valueOf(), // minTime
            moment("2024-06-06T12:09:00").valueOf()  // maxTime
        ],
        input: [["1min", "0min"]],
        isCumulative: false,
        isRelativeToRecent: false,
        periodType: 'natural',
        cutoffTime: 0,
        expectedOutput: [0, 0, 0, 0, -100, 0, 90, 0, -80, 0]
    }
];




class EventDataStore {
    getActivities = jest.fn();
};

testCases.forEach((testCase) => {
    // const testFunction = testCase.description === "累积式减去初值2" ? test.only : test;
    const testFunction = test;
    testFunction(testCase.description, () => {
        const dataStore = new EventDataStore();
        dataStore.getActivities.mockReturnValue(testCase.getActivitiesReturn);
        const calc = new ActivitiesCalc(dataStore as any);

        const result = calc.calculatePeriodStats(
            testCase.input as [string, string][],
            testCase.isCumulative,
            testCase.isRelativeToRecent,
            testCase.periodType as 'const' | 'variable' | 'natural',
            testCase.cutoffTime
        );

        const totalWords = result.map(segment => segment.totalWords);
        expect(totalWords).toEqual(testCase.expectedOutput);
    });
});
