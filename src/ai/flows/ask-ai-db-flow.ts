'use server';

import { ai } from '@/ai/genkit';
import { db } from '@/lib/db';
import { z } from 'genkit';
import { askAboutDish } from './ask-about-dish-flow';

const AskAiDbInputSchema = z.object({
  restaurantId: z.string().describe('Restaurant ID to scope data retrieval.'),
  question: z.string().describe("The user's question about the menu or restaurant."),
  includeFaq: z.boolean().default(true).describe('Whether to include FAQs as context.'),
});

const AskAiDbOutputSchema = z.object({
  answer: z.string(),
});

export type AskAiDbInput = z.infer<typeof AskAiDbInputSchema>;
export type AskAiDbOutput = z.infer<typeof AskAiDbOutputSchema>;

export async function askAiFromDb(input: AskAiDbInput): Promise<AskAiDbOutput> {
  return askAiDbFlow(input);
}

function buildTagsFromMenuItem(menuItem: {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
}): Array<'vegetarian' | 'vegan' | 'gluten-free' | 'spicy'> {
  const tags: Array<'vegetarian' | 'vegan' | 'gluten-free' | 'spicy'> = [];
  if (menuItem.isVegetarian) tags.push('vegetarian');
  if (menuItem.isVegan) tags.push('vegan');
  if (menuItem.isGlutenFree) tags.push('gluten-free');
  if (menuItem.isSpicy) tags.push('spicy');
  return tags;
}

const askAiDbFlow = ai.defineFlow(
  {
    name: 'askAiDbFlow',
    inputSchema: AskAiDbInputSchema,
    outputSchema: AskAiDbOutputSchema,
  },
  async ({ restaurantId, question, includeFaq }) => {
    const [restaurant, categories, faqs] = await Promise.all([
      db.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, name: true },
      }),
      db.menuCategory.findMany({
        where: { restaurantId, isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          name: true,
          menuItems: {
            where: { isAvailable: true },
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              isVegetarian: true,
              isVegan: true,
              isGlutenFree: true,
              isSpicy: true,
            },
          },
        },
      }),
      includeFaq
        ? db.fAQ.findMany({
            where: { restaurantId, isActive: true },
            orderBy: { viewCount: 'desc' },
            select: { id: true, question: true, answer: true, category: true },
          })
        : Promise.resolve([] as Array<{ id: string; question: string; answer: string; category: string | null }>),
    ]);

    const menu = {
      title: restaurant?.name ?? 'Menu',
      sections: categories.map((c) => ({
        id: c.id,
        title: c.name,
        items: c.menuItems.map((mi) => ({
          id: mi.id,
          name: mi.name,
          description: mi.description ?? '',
          price: mi.price.toString(),
          tags: buildTagsFromMenuItem(mi),
        })),
      })),
    };

    const faq = includeFaq
      ? faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer, category: f.category }))
      : undefined;

    const { answer } = await askAboutDish({
      menu: JSON.stringify(menu),
      faq: faq ? JSON.stringify(faq) : undefined,
      question,
    });

    return { answer };
  }
);