export enum Classification {
    REAL = 'REAL',
    FAKE = 'FAKE',
    UNCERTAIN = 'UNCERTAIN',
}

export interface AnalysisResult {
    classification: Classification;
    confidence: number;
    reasoning: string;
    isGenerated: boolean;
    generationAnalysis: string;
}
