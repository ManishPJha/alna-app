'use server';

import { ai } from '@/ai/genkit';
import { db } from '@/lib/db';
import { z } from 'genkit';
import { askAboutDish } from './ask-about-dish-flow';

const AskAiDbInputSchema = z.object({
  restaurantId: z.string().describe('Restaurant ID to scope data retrieval.'),
  question: z.string().describe("The user's question about the menu or restaurant."),
  includeFaq: z.boolean().default(true).describe('Whether to include FAQs as context.'),
  language: z.string().default('en').describe('Language code for the response (e.g., en, es, fr, de, it, pt, ja, zh, ko).'),
  menuId: z.string().optional().describe('Optional specific menu ID to query. If not provided, uses the most recent published menu.'),
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
    async ({ restaurantId, question, includeFaq, language, menuId }) => {
        // First, get the restaurant and determine which menu to use
        const restaurant = await db.restaurant.findUnique({
        where: { id: restaurantId },
            select: {
                id: true,
                name: true,
                menus: {
                    where: {
                        isActive: true,
                        isPublished: true,
                        ...(menuId && { id: menuId }), // If specific menuId provided, use it
                    },
                    orderBy: { updatedAt: 'desc' }, // Get most recent if no specific menuId
                    take: 1,
                    select: { id: true, name: true },
                },
            },
        });

        if (!restaurant) {
            return {
                answer: "I'm sorry, I couldn't find information about this restaurant.",
            };
        }

        // Get the target menu (either specified or most recent published)
        const targetMenu = restaurant.menus[0];

        // Get menu data and FAQs in parallel
        const [menuData, faqs] = await Promise.all([
            // Get menu categories and items through the Menu model
            db.menu.findUnique({
                where: { id: targetMenu.id },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    categories: {
                        where: { isActive: true },
                        orderBy: { displayOrder: 'asc' },
                        select: {
                            id: true,
                            name: true,
                            description: true,
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
                    },
                },
            }),
            // Get FAQs - can be restaurant-wide or menu-specific
            includeFaq
                ? db.fAQ.findMany({
                      where: {
                          restaurantId,
                          isActive: true,
                          OR: [
                              { menuId: targetMenu.id }, // Menu-specific FAQs
                              { menuId: null }, // Restaurant-wide FAQs
                          ],
                      },
                      orderBy: { viewCount: 'desc' },
                      select: {
                          id: true,
                          question: true,
                          answer: true,
                          category: true,
                          menuId: true, // To distinguish menu-specific vs restaurant-wide
                      },
                  })
                : Promise.resolve([]),
        ]);

        if (!menuData) {
            return {
                answer: "I'm sorry, I couldn't find the menu data for this restaurant.",
            };
        }

        // Transform the data into the expected format for the AI
        const menu = {
            title: `${restaurant.name} - ${menuData.name}`,
            description: menuData.description || '',
            sections: menuData.categories.map((category) => ({
                id: category.id,
                title: category.name,
                description: category.description || '',
                items: category.menuItems.map((menuItem) => ({
                    id: menuItem.id,
                    name: menuItem.name,
                    description: menuItem.description ?? '',
                    price: menuItem.price.toString(),
                    tags: buildTagsFromMenuItem(menuItem),
                })),
            })),
        };

        // Prepare FAQ data with context about whether they're menu-specific
        const faq =
            includeFaq && faqs.length > 0
                ? faqs.map((f) => ({
                      id: f.id,
                      question: f.question,
                      answer: f.answer,
                      category: f.category,
                      scope: f.menuId ? 'menu-specific' : 'restaurant-wide',
                  }))
                : undefined;

        // Call the AI with the prepared data
        const { answer } = await askAboutDish({
            menu: JSON.stringify(menu),
            faq: faq ? JSON.stringify(faq) : undefined,
            question,
            language,
        });

        return { answer };
    }
);
