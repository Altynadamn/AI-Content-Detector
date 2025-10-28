
export interface AnalysisResult {
  prediction: 'AI' | 'Human' | 'Unsure';
  reason: string;
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  result?: AnalysisResult;
  error?: string;
}

export type BatchResult = {
  id: string;
  success: true;
  data: AnalysisResult;
} | {
  id: string;
  success: false;
  error: string;
};
