
'use server';
/**
 * @fileOverview A flow for answering customer questions about the menu.
 *
 * - askAboutDish - A function that handles answering questions about the menu.
 * - AskAboutDishInput - The input type for the askAboutDish function.
 * - AskAboutDishOutput - The return type for the askAboutDish function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AskAboutDishInputSchema = z.object({
  menu: z.string().describe('The entire menu as a JSON string.'),
  faq: z.string().describe('A list of frequently asked questions and their answers, as a JSON string.').optional(),
  question: z.string().describe('The user\'s question about the menu.'),
  language: z.string().default('en').describe('Language code for the response (e.g., en, es, fr, de, it, pt, ja, zh, ko).'),
});
export type AskAboutDishInput = z.infer<typeof AskAboutDishInputSchema>;

const AskAboutDishOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question.'),
});
export type AskAboutDishOutput = z.infer<typeof AskAboutDishOutputSchema>;

export async function askAboutDish(input: AskAboutDishInput): Promise<AskAboutDishOutput> {
  return askAboutDishFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAboutDishPrompt',
  input: {schema: AskAboutDishInputSchema},
  output: {schema: AskAboutDishOutputSchema},
  prompt: `You are a friendly and helpful AI assistant for a restaurant. 
  A customer is asking a question about the menu. Your goal is to provide a concise and accurate answer based on the information provided.

  **IMPORTANT: Always respond in the language specified by the user. If the language is not English, translate your response to that language.**

  Here's how you should answer:
  1.  **Check the FAQ First:** Always start by looking at the Frequently Asked Questions (FAQ) to see if the user's question is answered there. If you find a relevant FAQ, use that for your response.
  2.  **Use the Menu for Specifics:** If the question is not in the FAQ, use the menu data.
      *   For questions about a **specific dish** (e.g., "What's in the Bruschetta?", "How much is the Grilled Salmon?"), find that item in the menu and use its 'description' to talk about ingredients and 'price' for the cost.
      *   For **general questions** (e.g., "What are your vegetarian options?"), look through the entire menu to find all items that match the query (like items with the 'vegetarian' tag).
  3.  **Be Friendly and Concise:** Keep your answers short, friendly, and to the point.
  4.  **Language:** Respond in {{language}} language.

  {{#if faq}}
  FAQ (JSON format):
  \`\`\`json
  {{{faq}}}
  \`\`\`
  {{/if}}

  Menu (JSON format):
  \`\`\`json
  {{{menu}}}
  \`\`\`

  Customer's Question: "{{question}}"
  `,
});

const askAboutDishFlow = ai.defineFlow(
  {
    name: 'askAboutDishFlow',
    inputSchema: AskAboutDishInputSchema,
    outputSchema: AskAboutDishOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
