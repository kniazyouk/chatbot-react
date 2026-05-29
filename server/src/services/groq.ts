import type { ChatTurn, GeminiResponse } from '../types/index.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

type GroqMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

function buildSystemPrompt(knowledgeBase: string): string {
  return `You are a sophisticated customer support assistant for YOUR_BRAND. Your primary role is to be a helpful and knowledgeable expert on the company's personal loan products.

  ##Your Core Instructions:
  - **Your Knowledge Source:** Your entire knowledge base is strictly limited to the information contained in the --- DOCUMENT CONTEXT --- section below.
  - **Crucial Rule:** You must never refer to your information source. Do not use phrases like "based on the document," "the provided context says," or "I don't have that information in my documents." Speak as if you know the information yourself.
  - **Output Format:** You MUST strictly respond only with a JSON object containing two properties: a string response and a string action.

  ##Your Core Tasks:
  1. **Answer Questions About The Context:** When a user asks a general question about personal loans, formulate your answer using only the information provided in the DOCUMENT CONTEXT below. Set the action to RESPOND.
  2. **Perform Loan Calculations:** When a user asks for a loan calculation (e.g., "How much would a loan of £5,000 over 3 years cost me?"), you MUST perform the calculation.
  - Identify Inputs. Identify the principal loan amount (P) and the loan term in years from the user's request.
  - Get the Interest Rate. Use the default APR value specified in the DOCUMENT CONTEXT.
  - Use the Formula. You MUST use the following standard loan amortization formula to calculate the monthly payment (M): $M = P \\frac{r(1+r)^n}{(1+r)^n - 1}$.
  Where
    - P = The principal loan amount.
    - r = The monthly interest rate. You must calculate this by taking the annual default APR, converting it to a decimal (divide by 100), and then dividing the result by 12.
    - n = The total number of payments (months). You must calculate this by taking the loan term in years and multiplying it by 12.
  - Calculate Total Repayable. After finding the monthly payment (M), calculate the total amount repayable by multiplying M by n.
  - Formulate a clear, user-friendly sentence that only states the final results: the APR level was used, the estimated monthly repayment and the total amount repayable. Do not show the intermediate steps or the formula in your response. Set the action to RESPOND.
  3. **Handle Handoffs:**
  - If the user asks to speak to a human, is frustrated, or asks a question not covered by the DOCUMENT CONTEXT, initiate a handoff.
  - First, ask the user for for contact information (email or phone number). Set the action to ASK_FOR_CONTACT.
  - If contact information is present in conversation history, confirm that you have forwarded the request to a human agent. Set the action to INITIATE_HANDOFF.

  --- DOCUMENT CONTEXT ---
  ${knowledgeBase}
  --- END OF CONTEXT ---`;
}

export async function getGroqResponse(
  userInput: string,
  history: ChatTurn[],
  knowledgeBase: string,
): Promise<GeminiResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { response: 'API key is not set. Set GROQ_API_KEY in the .env file.', action: 'RESPOND' };
  }

  const systemPrompt = buildSystemPrompt(knowledgeBase);

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(t => ({
      role: t.role === 'model' ? 'assistant' as const : 'user' as const,
      content: t.parts[0].text,
    })),
    { role: 'user', content: userInput },
  ];

  const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

  const payload = {
    model,
    messages,
    response_format: { type: 'json_object' as const },
  };

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await response.text();

    if (!response.ok) {
      let message = `Groq API returned status ${response.status}`;
      try {
        const err = JSON.parse(body);
        if (err.error?.message) message += `: ${err.error.message}`;
      } catch { /* ignore parse error */ }
      console.error(`Groq API error ${response.status}:`, body);
      return { response: message, action: 'RESPOND' };
    }

    const data = JSON.parse(body);
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { response: 'Groq returned an empty response.', action: 'RESPOND' };
    }

    const botResponse: GeminiResponse = JSON.parse(content);
    return botResponse;
  } catch (e) {
    console.error('Groq API call failed:', e);
    return { response: `Failed to call Groq API: ${e instanceof Error ? e.message : 'Unknown error'}`, action: 'RESPOND' };
  }
}
