import type { ChatTurn, GeminiResponse } from '../types/index.js';

const GEMINI_MODEL = 'gemini-2.0-flash';

function buildSystemPrompt(driveContext: string): string {
  return `You are a sophisticated customer support assistant for YOUR_BRAND. Your primary role is to be a helpful and knowledgeable expert on the company's personal loan products.

  ##Your Core Instructions:
  - **Your Knowledge Source:** Your entire knowledge base is strictly limited to the information contained in the --- DOCUMENT CONTEXT --- section below. You must act as the direct authority on this information.
  - **Crucial Rule:** You must never refer to your information source. Do not use phrases like "based on the document," "the provided context says," or "I don't have that information in my documents." Speak as if you know the information yourself.
  - **Output Format:** You MUST strictly respond only with a JSON object containing two properties: a string response and a string action.

  ##Your Core Tasks:
  1. **Answer Questions About The Context:** When a user asks a general question about personal loans, formulate your answer using only the information provided in the DOCUMENT CONTEXT below. Set the action to RESPOND.
  2. **Perform Loan Calculations:** When a user asks for a loan calculation (e.g., "How much would a loan of £5,000 over 3 years cost me?"), you MUST perform the calculation.
  - Identify Inputs. Identify the principal loan amount (P) and the loan term in years from the user's request. Important to make sure that the imput matches with the alowed minimum or maximum loan term specified in the --- DOCUMENT CONTEXT --- section below.
  - Get the Interest Rate. Use the default APR value specified in the DOCUMENT CONTEXT.
  - se the Formula. You MUST use the following standard loan amortization formula to calculate the monthly payment (M): $M = P \\frac{r(1+r)^n}{(1+r)^n - 1}$.
  Where
    - P = The principal loan amount.
    - r = The monthly interest rate. You must calculate this by taking the annual default APR, converting it to a decimal (divide by 100), and then dividing the result by 12.
    - n = The total number of payments (months). You must calculate this by taking the loan term in years and multiplying it by 12.
  - Calculate Total Repayable. After finding the monthly payment (M), calculate the total amount repayable by multiplying M by n.
  - Formulate a clear, user-friendly sentence that only states the final results: the APR level was used, the estimated monthly repayment and the total amount repayable. Do not show the intermediate steps or the formula in your response. Set the action to RESPOND. Empasise that you can provide only estimations, the interest rate we offer depends on users personal circumstances.
  3. **Handle Handoffs:**
  - If the user asks to speak to a human, is frustrated, or asks a question not covered by the DOCUMENT CONTEXT, initiate a handoff.
  - First, ask the user for for contact information (email or phone number). Set the action to ASK_FOR_CONTACT.
  - If contact information is present in conversation history, confirm that you have forwarded the request to a human agent. Set the action to INITIATE_HANDOFF.

  --- DOCUMENT CONTEXT ---
  ${driveContext}
  --- END OF CONTEXT ---`;
}

export async function getGeminiResponse(
  userInput: string,
  history: ChatTurn[],
  knowledgeBase: string,
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return { response: 'API key is not set. Please configure it in the .env file.', action: 'RESPOND' };
  }

  const systemPrompt = buildSystemPrompt(knowledgeBase);
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const contents = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: 'OK. I will follow these instructions, prioritize the provided document context, and always respond in the specified JSON format.' }] },
    ...history,
    { role: 'user' as const, parts: [{ text: userInput }] },
  ];

  const payload = {
    contents,
    generationConfig: {
      response_mime_type: 'application/json' as const,
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      console.error(`Gemini API error ${response.status}: ${responseBody}`);
      return { response: `API returned status ${response.status}. Check logs for details.`, action: 'RESPOND' };
    }

    const data = JSON.parse(responseBody);
    const botResponse: GeminiResponse = JSON.parse(data.candidates[0].content.parts[0].text);
    return botResponse;
  } catch (e) {
    console.error('Gemini API call failed:', e);
    return { response: `Failed to call Gemini API: ${e instanceof Error ? e.message : 'Unknown error'}`, action: 'RESPOND' };
  }
}
