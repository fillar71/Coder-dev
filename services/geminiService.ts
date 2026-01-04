import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const chatWithAI = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string
): Promise<AIResponse> => {
  try {
    const model = 'gemini-3-pro-preview';
    
    const systemInstruction = `
      You are an expert AI Fullstack Developer using Next.js, React, and Tailwind CSS.
      
      Your goal is to help the user write code and prepare it for automated GitHub commits.
      
      RESPONSE FORMAT:
      You MUST respond with a JSON object containing two fields:
      1. "text": A conversational response explaining what you did or answering the question.
      2. "structuredData": A JSON object (OR null if just chatting) with:
         - "action": "COMMIT" (if proposing code changes) or "CHAT".
         - "file_path": The path of the file to change (e.g., "app/page.tsx").
         - "commit_message": A concise git commit message.
         - "new_content": The FULL source code for the file (Next.js/React code).
         - "preview_content": (Optional) A minimal, self-contained React component string using 'export default function App() {}' that can be rendered in a live preview to demonstrate the visual changes.
      
      Example of "preview_content":
      "export default function Preview() { return <div className='p-4 bg-red-500 text-white'>Hello</div>; }"

      IMPORTANT:
      - Always provide valid JSON in your response.
      - If you are writing code, ensuring 'action' is 'COMMIT'.
      - Do not wrap the JSON in markdown code blocks like \`\`\`json. Return pure JSON string.
    `;

    // Construct the conversation history for the context
    // We add the system instruction to the prompt context implicitly via specific prompt engineering
    // or by using the systemInstruction config if supported, but here we'll append to the prompt for simplicity
    // in this stateless request wrapper.
    
    // For this specific turn-based implementation:
    const prompt = `
      ${systemInstruction}

      Current Conversation History:
      ${history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n')}
      
      USER: ${newMessage}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json" 
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("No response from AI");

    try {
      const parsed = JSON.parse(rawText);
      return {
        text: parsed.text || "Here is the code.",
        structuredData: parsed.structuredData || null
      };
    } catch (e) {
      console.error("Failed to parse JSON response:", rawText);
      return { text: rawText, structuredData: null };
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
      text: "Sorry, I encountered an error. Please try again.", 
      structuredData: null 
    };
  }
};

export const generateCodeRefinement = async (code: string, instructions: string): Promise<string> => {
  try {
    const model = 'gemini-3-pro-preview';
    const prompt = `
      You are an expert software engineer.
      
      TASK: Update the following code based on the user's instructions.
      
      EXISTING CODE:
      ${code}
      
      INSTRUCTIONS:
      ${instructions}
      
      RESPONSE FORMAT:
      Return ONLY the full updated code. Do not include markdown formatting (like \`\`\`tsx). Do not include explanations.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    let text = response.text || '';
    // Strip markdown code blocks if present
    text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '');
    return text.trim();
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    throw new Error("Failed to refine code.");
  }
};

export const askGeminiExplanation = async (code: string, question: string): Promise<string> => {
  try {
    const model = 'gemini-3-pro-preview';
    const prompt = `
      You are an expert software engineer.
      
      CODE CONTEXT:
      ${code}
      
      USER QUESTION:
      ${question}
      
      Answer the user's question about the code clearly and concisely.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "I couldn't generate an explanation.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Sorry, I encountered an error getting the explanation.";
  }
};