import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, WorkshopGuide } from "../types";

interface VerificationResponse {
  is_valid: boolean;
  compliment: string;
}

// Helper to read env vars in both Vite (browser) and Node
const getEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore - Vite injects import.meta.env at build time
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

const geminiApiKey =
  getEnv("VITE_GEMINI_API_KEY") ||
  getEnv("GEMINI_API_KEY");

if (!geminiApiKey) {
  console.warn(
    "Gemini API key is not set. Set VITE_GEMINI_API_KEY (recommended) or GEMINI_API_KEY in your environment."
  );
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: geminiApiKey || "" });

const cleanJSON = (text: string): string => {
  return text.replace(/```json\n?|```/g, "").trim();
};

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  // Remove data URL prefix if present for the API call
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: `Identify the main waste item in this image. Determine if it is typically recyclable. Provide disposal instructions and 3 creative DIY upcycling ideas.
              
              If the image is unclear, return a generic 'Unknown Item' result but still suggest general eco-friendly tips.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            isRecyclable: { type: Type.BOOLEAN },
            disposalInstruction: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
            diyOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                  description: { type: Type.STRING },
                },
                required: ["title", "difficulty", "description"],
              },
            },
          },
          required: ["itemName", "isRecyclable", "disposalInstruction", "diyOptions"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(cleanJSON(response.text)) as AnalysisResult;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback for demo purposes if API fails
    return {
      itemName: "Unknown Item",
      isRecyclable: false,
      disposalInstruction: "Could not analyze image. Please check local guidelines.",
      confidence: 0,
      diyOptions: [],
    };
  }
};

export const getDIYGuide = async (item: string, project: string): Promise<WorkshopGuide> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a step-by-step DIY guide for making a "${project}" out of "${item}". 
      Include a list of materials, safety warnings, and a search query I can use to find this on YouTube.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            materials: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            warning: { type: Type.STRING },
            youtubeQuery: { type: Type.STRING },
          },
          required: ["materials", "steps", "warning", "youtubeQuery"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(cleanJSON(response.text)) as WorkshopGuide;
    }
    throw new Error("No guide generated");
  } catch (error) {
    console.error("Gemini Workshop Error:", error);
    return {
      materials: ["N/A"],
      steps: ["Could not generate steps. Please try again."],
      warning: "Be careful when using tools.",
      youtubeQuery: `DIY ${project} ${item}`,
    };
  }
};

// Prompt C: Verification - check if the finished craft matches the requested project
export const verifyUpcycle = async (
  base64Image: string,
  projectTitle: string
): Promise<VerificationResponse> => {
  if (!geminiApiKey) {
    console.warn("[Gemini] Verification called without API key configured.");
    throw new Error("MISSING_GEMINI_API_KEY");
  }

  // Remove data URL prefix if present for the API call
  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    ""
  );

  const prompt = `
    I asked the user to make a "${projectTitle}".
    Look at this image.
    Does this image plausibly look like a DIY "${projectTitle}" or a craft attempt?
    The project does NOT need to be perfect. Be GENEROUS and encouraging:
    - If there is any reasonable chance this is their "${projectTitle}" project or a real attempt, set "is_valid" to true.
    - Only set "is_valid" to false if the image is clearly unrelated OR the craft cannot be seen at all.

    Return strictly JSON:
    {
      "is_valid": boolean,
      "compliment": "string (A short encouraging comment about their work)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_valid: { type: Type.BOOLEAN },
            compliment: { type: Type.STRING },
          },
          required: ["is_valid", "compliment"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(cleanJSON(response.text)) as VerificationResponse;
    }
    throw new Error("No verification response from Gemini");
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    // On failure (offline, quota limits, etc.), treat as not verified.
    return {
      is_valid: false,
      compliment: "",
    };
  }
};
