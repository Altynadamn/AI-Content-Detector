
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVideoFrames = async (base64Frames: string[]): Promise<AnalysisResult> => {
    try {
        const imageParts = base64Frames.map(frame => ({
            inlineData: {
                data: frame,
                mimeType: 'image/jpeg',
            },
        }));

        const prompt = "You are an expert in detecting AI-generated videos and deepfakes. Analyze the following frames extracted from a video. Determine if the video is authentic or a deepfake. Look for common artifacts like unnatural facial movements, blinking inconsistencies, skin texture flaws, weird lighting, or background distortions. Respond with ONLY a JSON object based on the provided schema.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [...imageParts, { text: prompt }],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        is_fake: { 
                            type: Type.BOOLEAN,
                            description: "True if the video is determined to be a deepfake/AI-generated, false otherwise."
                        },
                        confidence: { 
                            type: Type.NUMBER,
                            description: "A confidence score between 0 and 1 for the is_fake determination."
                        },
                        reasoning: { 
                            type: Type.STRING,
                            description: "A brief explanation for the determination, highlighting detected artifacts or lack thereof."
                        },
                    },
                    required: ['is_fake', 'confidence', 'reasoning'],
                },
            },
        });

        const resultText = response.text.trim();
        const parsedResult = JSON.parse(resultText) as AnalysisResult;

        // Basic validation
        if (typeof parsedResult.is_fake !== 'boolean' || typeof parsedResult.confidence !== 'number' || typeof parsedResult.reasoning !== 'string') {
            throw new Error("API returned malformed analysis data.");
        }

        return parsedResult;

    } catch (error) {
        console.error("Error analyzing video frames:", error);
        throw new Error("Failed to get analysis from the AI model. Please check the console for more details.");
    }
};
