'use server';
/**
 * @fileOverview A flow for translating the menu into different languages.
 *
 * - translateMenu - A function that translates the menu.
 * - TranslateMenuInput - The input type for the translateMenu function.
 * - Menu - The return type for the translateMenu function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MenuItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.string(),
    tags: z.array(z.enum(['vegetarian', 'vegan', 'gluten-free', 'spicy'])),
});

const MenuSectionSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(MenuItemSchema),
});

const MenuSchema = z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(MenuSectionSchema),
});

export type Menu = z.infer<typeof MenuSchema>;

const TranslateMenuInputSchema = z.object({
    menu: z.string().describe('The entire menu as a JSON string.'),
    language: z
        .string()
        .describe(
            'The target language to translate the menu into (e.g., "Spanish", "French", "Japanese").'
        ),
});
export type TranslateMenuInput = z.infer<typeof TranslateMenuInputSchema>;

export async function translateMenu(input: TranslateMenuInput): Promise<Menu> {
    return translateMenuFlow(input);
}

const prompt = ai.definePrompt({
    name: 'translateMenuPrompt',
    input: { schema: TranslateMenuInputSchema },
    output: { schema: MenuSchema },
    prompt: `You are a professional translator specializing in restaurant menus.
  Your task is to translate the provided menu into the target language.

  Follow these rules:
  1.  **Translate All Text:** Translate the 'title' of the menu, the 'title' of each section, and the 'name' and 'description' of each menu item.
  2.  **Do Not Translate IDs and Prices:** The 'id', 'price', and 'tags' fields must remain exactly the same as in the original menu.
  3.  **Maintain Structure:** The output must be a valid JSON object with the exact same structure as the input menu.
  4.  **Natural Language:** Ensure the translations sound natural and appealing for a restaurant context.

  Original Menu (JSON format):
  \`\`\`json
  {{{menu}}}
  \`\`\`

  Target Language: {{language}}
  `,
});

const translateMenuFlow = ai.defineFlow(
    {
        name: 'translateMenuFlow',
        inputSchema: TranslateMenuInputSchema,
        outputSchema: MenuSchema,
    },
    async (input) => {
        try {
            const { output } = await prompt(input);
            return output!;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // Handle specific API errors
            if (
                error.message?.includes('429') ||
                error.message?.includes('quota')
            ) {
                throw new Error(
                    'Translation service is temporarily unavailable due to high usage. Please try again later or contact support.'
                );
            }

            if (
                error.message?.includes('401') ||
                error.message?.includes('unauthorized')
            ) {
                throw new Error(
                    'Translation service authentication failed. Please check your API configuration.'
                );
            }

            if (
                error.message?.includes('500') ||
                error.message?.includes('internal server error')
            ) {
                throw new Error(
                    'Translation service is experiencing technical difficulties. Please try again later.'
                );
            }

            // Generic error handling
            console.error('Translation flow error:', error);
            throw new Error(
                'Failed to translate menu. Please try again later.'
            );
        }
    }
);
