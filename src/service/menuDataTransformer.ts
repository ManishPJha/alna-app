/* eslint-disable @typescript-eslint/no-explicit-any */
import { MenuFormData } from '@/types/menu';

export class MenuDataTransformer {
    /**
     * Transform API response to MenuFormData for form consumption
     */
    static fromApiResponse(apiResponse: any): MenuFormData {
        try {
            // Handle both direct menu data and nested response formats
            const menuData = apiResponse.data || apiResponse;

            if (!menuData) {
                throw new Error('No menu data found in API response');
            }

            return {
                id: menuData.id,
                name: menuData.name || '',
                description: menuData.description || '',
                restaurantId: menuData.restaurantId || '',
                isActive: menuData.isActive !== false,
                categories: (menuData.categories || []).map(
                    (category: any) => ({
                        id: category.id,
                        name: category.name || '',
                        description: category.description || '',
                        displayOrder: category.displayOrder || 0,
                        isActive: category.isActive !== false,
                        items: (category.items || []).map((item: any) => ({
                            id: item.id,
                            name: item.name || '',
                            description: item.description || '',
                            price:
                                typeof item.price === 'string'
                                    ? parseFloat(item.price)
                                    : item.price || 0,
                            isVegetarian: item.isVegetarian || false,
                            isVegan: item.isVegan || false,
                            isGlutenFree: item.isGlutenFree || false,
                            isSpicy: item.isSpicy || false,
                            isAvailable: item.isAvailable !== false,
                            displayOrder: item.displayOrder || 0,
                            categoryId: item.categoryId,
                        })),
                    })
                ),
                faqs: (menuData.faqs || []).map((faq: any) => ({
                    id: faq.id,
                    question: faq.question || '',
                    answer: faq.answer || '',
                })),
                theme: menuData.theme || {
                    primaryColor: '#1f2937',
                    backgroundColor: '#f9fafb',
                    accentColor: '#ef4444',
                    fontFamily: 'Inter',
                },
            };
        } catch (error) {
            console.error('Error transforming API response:', error);
            throw new Error('Failed to transform menu data');
        }
    }

    /**
     * Transform MenuFormData to API format for submission
     */
    static toApiFormat(formData: MenuFormData): any {
        return {
            name: formData.name,
            description: formData.description,
            restaurantId: formData.restaurantId,
            isActive: formData.isActive,
            isPublished: formData.isActive, // Use isActive for isPublished for now
            categories: (formData.categories || []).map((category) => ({
                id: category.id,
                name: category.name,
                description: category.description,
                displayOrder: category.displayOrder,
                isActive: category.isActive,
                items: (category.items || []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    isVegetarian: item.isVegetarian,
                    isVegan: item.isVegan,
                    isGlutenFree: item.isGlutenFree,
                    isSpicy: item.isSpicy,
                    isAvailable: item.isAvailable,
                    displayOrder: item.displayOrder,
                    categoryId: item.categoryId,
                })),
            })),
            faqs: (formData.faqs || []).map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
            })),
            theme: formData.theme,
        };
    }

    /**
     * Validate API response structure
     */
    static validateApiResponse(apiResponse: any): boolean {
        try {
            const menuData = apiResponse.data || apiResponse;

            if (!menuData || typeof menuData !== 'object') {
                return false;
            }

            // Basic required fields check
            if (!menuData.name || !menuData.restaurantId) {
                return false;
            }

            // Validate categories structure if present
            if (menuData.categories && Array.isArray(menuData.categories)) {
                for (const category of menuData.categories) {
                    if (!category.name) {
                        return false;
                    }

                    // Validate items structure if present
                    if (category.items && Array.isArray(category.items)) {
                        for (const item of category.items) {
                            if (!item.name || item.price === undefined) {
                                return false;
                            }
                        }
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    /**
     * Get default menu form data
     */
    static getDefaultFormData(): MenuFormData {
        return {
            id: undefined,
            name: '',
            description: '',
            restaurantId: '',
            isActive: true,
            categories: [],
            faqs: [],
            theme: {
                primaryColor: '#1f2937',
                backgroundColor: '#f9fafb',
                accentColor: '#ef4444',
                fontFamily: 'Inter',
            },
        };
    }
}
