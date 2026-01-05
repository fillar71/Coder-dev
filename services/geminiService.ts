import { GoogleGenAI } from "@google/genai";
import { AIModelConfig } from "../types";

export interface AIResponse {
  text: string;
  structuredData?: {
    action: "COMMIT" | "CHAT";
    file_path?: string;
    commit_message?: string;
    new_content?: string;
    preview_content?: string;
  };
}

const SYSTEM_INSTRUCTION = `
You are an expert AI Fullstack Developer using Next.js, React, and Tailwind CSS.

Your goal is to help the user write code and prepare it for automated GitHub commits.

RESPONSE FORMAT:
You MUST respond with a generic JSON object containing two fields:
1. "text": A conversational response explaining what you did or answering the question.
2. "structuredData": A JSON object (OR null if just chatting) with:
   - "action": "COMMIT" (if proposing code changes) or "CHAT".
   - "file_path": The path of the file to change (e.g., "app/page.tsx").
   - "commit_message": A concise git commit message.
   - "new_content": The FULL source code for the file (Next.js/React code).
   - "preview_content": (Optional) A minimal, self-contained React component string using 'export default function App() {}' that can be rendered in a live preview.

IMPORTANT:
- Always provide valid JSON in your response.
- Do not wrap the JSON in markdown code blocks. Return pure JSON string.
`;

// --- Helper: Google Gemini Provider ---
async function callGemini(modelId: string, history: any[], newMessage: string): Promise<string> {
  if (!process.env.API_KEY) throw new Error("API_KEY (Google) is missing.");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
      ${SYSTEM_INSTRUCTION}

      Current Conversation History:
      ${history.map((h: any) => `${h.role.toUpperCase()}: ${h.text}`).join('\n')}
      
      USER: ${newMessage}
    `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json" 
    }
  });

  return response.text || "";
}

// --- Helper: Groq / OpenAI Provider (OpenAI Compatible) ---
async function callOpenAICompatible(
  provider: 'groq' | 'openai',
  modelId: string, 
  history: any[], 
  newMessage: string
): Promise<string> {
  
  let apiKey, baseUrl;

  if (provider === 'groq') {
    apiKey = process.env.GROQ_API_KEY;
    baseUrl = "https://api.groq.com/openai/v1/chat/completions";
    if (!apiKey) throw new Error("GROQ_API_KEY is missing in .env");
  } else {
    apiKey = process.env.OPENAI_API_KEY;
    baseUrl = "https://api.openai.com/v1/chat/completions";
    if (!apiKey) throw new Error("OPENAI_API_KEY is missing in .env");
  }

  // Convert history to OpenAI format
  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map((h: any) => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.text
    })),
    { role: "user", content: newMessage }
  ];

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages,
      response_format: { type: "json_object" } // Force JSON mode
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`${provider.toUpperCase()} API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// --- Main Handler ---

export const chatWithAI = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  modelConfig: AIModelConfig
): Promise<AIResponse> => {
  try {
    let rawText = "";

    switch (modelConfig.provider) {
      case 'google':
        rawText = await callGemini(modelConfig.id, history, newMessage);
        break;
      case 'groq':
      case 'openai':
        rawText = await callOpenAICompatible(modelConfig.provider, modelConfig.id, history, newMessage);
        break;
      default:
        throw new Error("Unsupported provider");
    }

    if (!rawText) throw new Error("No response from AI");

    // Clean up potential markdown formatting if the model ignored "pure json" instruction
    const cleanedText = rawText.replace(/^```json\n?/i, '').replace(/\n?```$/, '');

    try {
      const parsed = JSON.parse(cleanedText);
      return {
        text: parsed.text || "Here is the code.",
        structuredData: parsed.structuredData || null
      };
    } catch (e) {
      console.error("Failed to parse JSON response:", rawText);
      // Fallback if JSON parsing fails but we have text
      return { text: rawText, structuredData: null };
    }

  } catch (error: any) {
    console.error("AI Service Error:", error);
    const errorMessage = error.message || String(error);
    
    return { 
      text: `Error (${modelConfig.provider}): ${errorMessage}. Please check your API keys and configuration.`, 
      structuredData: null 
    };
  }
};

// --- Dedicated Gemini Assistant Functions ---

export const generateCodeRefinement = async (code: string, instruction: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY (Google) is missing.");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = 'gemini-2.0-flash'; // Default fast model

  const prompt = `
    You are an expert developer.
    
    EXISTING CODE:
    ${code}

    INSTRUCTION: ${instruction}

    Output the full modified code based on the instruction.
    Ensure the code is complete and functional.
    Return ONLY the code. Do not wrap in markdown code blocks (no \`\`\`).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    
    let text = response.text || "";
    // Robust cleanup
    text = text.replace(/^```(typescript|javascript|tsx|jsx)?\n?/i, '').replace(/\n?```$/, '');
    return text;
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    throw error;
  }
};

export const askGeminiExplanation = async (code: string, question: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY (Google) is missing.");
   
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = 'gemini-2.0-flash'; 

  const prompt = `
    You are an expert developer.
    
    CODE CONTEXT:
    ${code}

    QUESTION: ${question}

    Provide a clear and concise explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "No response.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    throw error;
  }
};