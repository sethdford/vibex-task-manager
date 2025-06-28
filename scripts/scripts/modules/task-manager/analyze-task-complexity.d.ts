export default analyzeTaskComplexity;
declare function analyzeTaskComplexity(options: any, context?: {}): Promise<{
    report: any;
    telemetryData: any;
} | {
    report: {
        meta: {
            generatedAt: string;
            tasksAnalyzed: any;
            totalTasks: number;
            analysisCount: any;
            thresholdScore: number;
            projectName: string;
            usedResearch: any;
        };
        complexityAnalysis: any;
    };
    telemetryData: Record<string, any>;
}>;
//# sourceMappingURL=analyze-task-complexity.d.ts.map