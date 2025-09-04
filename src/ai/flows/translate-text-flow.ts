'use server';
/**
 * @fileOverview Flow for translating arbitrary text to a target language (default: English).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().min(1, 'Text required').describe('User provided text to translate'),
  targetLanguage: z
    .string()
    .default('English')
    .describe('Target language name, e.g., "English", "Spanish"'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translated: z.string(),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `You are a professional translator.
Translate the following user-provided text into {{targetLanguage}}.

Return the result strictly as a single-line JSON object with this exact shape:
{"translated": "<translated text>"}
Do not include any other keys, comments, or formatting.

Text to translate:
"""
{{text}}
"""`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
