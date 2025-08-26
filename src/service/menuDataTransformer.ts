/* eslint-disable @typescript-eslint/no-explicit-any */
import { MenuFormData, getDefaultMenuFormData } from '@/types/menu';

export class MenuDataTransformer {
    /**
     * Transform API response to MenuFormData - handles any response structure
     */
    static fromApiResponse(apiResponse: any): MenuFormData | null {
        console.log('Transforming API response:', apiResponse);

        // Handle different response structures
        let menuData = apiResponse;

        // If response has a 'data' property, use that
        if (apiResponse?.data) {
            menuData = apiResponse?.data || apiResponse;
        }

        // If response has a 'menu' property, use that
        if (apiResponse?.menu) {
            menuData = apiResponse?.menu || apiResponse;
        }

        if (!menuData) {
            console.error('No menu data found in API response');
            return null;
        }
        
        try {
            // Extract restaurant info from various possible locations
            const restaurant = this.extractRestaurantInfo(menuData);
            // const category = this.extractCategoryInfo(menuData);
            const categories = Array.isArray(menuData.categories)
                ? menuData.categories.map(this.extractCategoryInfo)
                : [];
            const menuItems = this.extractMenuItems(menuData, categories);

            console.log('Extracted data:', {
                restaurant,
                categories,
                menuItems,
            });

            // Build the form data structure
            const formData: MenuFormData = {
                name: restaurant.name || 'Untitled Menu',
                description: restaurant.description || '',
                restaurantId: restaurant.id || '',
                restaurant: restaurant,
                isActive: menuData.isActive ?? menuData.isAvailable ?? true,
                // categories: category
                //     ? [
                //           {
                //               id: category.id,
                //               name: category.name,
                //               description: category.description || '',
                //               displayOrder: category.displayOrder || 0,
                //               isActive: category.isActive ?? true,
                //               items: menuItems,
                //           },
                //       ]
                //     : [],
                categories: categories.length
                    ? categories.map((cat: any) => ({
                          id: cat.id,
                          name: cat.name,
                          description: cat.description || '',
                          displayOrder: cat.displayOrder || 0,
                          isActive: cat.isActive ?? true,
                          items: menuItems.filter(
                              (item) => item.categoryId === cat.id
                          ),
                      }))
                    : [],
                theme: restaurant.menuTheme || getDefaultMenuFormData().theme,
                id: menuData.id, // Include ID for QR code generation
                faqs: menuData.faqs || [], // Include FAQs if present
            };

            console.log('Final form data:', formData);
            return formData;
        } catch (error) {
            console.error('Error transforming menu data:', error);
            return null;
        }
    }

    /**
     * Extract restaurant information from various possible locations in the response
     */
    private static extractRestaurantInfo(data: any): any {
        // Try different paths to find restaurant data
        const possiblePaths = [
            data.restaurant,
            data.category?.restaurant,
            data.menu?.category?.restaurant,
            data.category?.restaurant,
        ];

        for (const path of possiblePaths) {
            if (path && path.id) {
                return {
                    id: path.id,
                    name: path.name,
                    description: path.description,
                    menuTheme: path.menuTheme,
                };
            }
        }

        // Fallback: try to extract from the main data object
        return {
            id: data.restaurantId || '',
            name: data.restaurantName || data.name || '',
            description: data.restaurantDescription || data.description || '',
            menuTheme: data.menuTheme || data.theme,
        };
    }

    /**
     * Extract category information from the response
     */
    private static extractCategoryInfo(data: any): any | null {
        // // Try different paths to find category data
        // const possiblePaths = [
        //     data.category,
        //     data.categories,
        //     data.menu?.category,
        //     data.menu?.categories,
        // ];

        // for (const path of possiblePaths) {
        //     if (path && path.id) {
        //         return {
        //             id: path.id,
        //             name: path.name,
        //             description: path.description,
        //             displayOrder: path.displayOrder,
        //             isActive: path.isActive,
        //             items: path.menuItems || [],
        //         };
        //     }  else if (path && path.id) {
        //         return {
        //             id: path.id,
        //             name: path.name,
        //             description: path.description,
        //             displayOrder: path.displayOrder,
        //             isActive: path.isActive,
        //             items: path.menuItems || [],
        //         };
        //     }
        // }

        // // If no category found, create one from the item's categoryId
        // if (data.categoryId) {
        //     return {
        //         id: data.categoryId,
        //         name: 'Default Category',
        //         description: '',
        //         displayOrder: 0,
        //         isActive: true,
        //     };
        // }

        if (data && data.id) {
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
                items: data.menuItems || data.items || [],
            };
        }

        return null;
    }

    /**
     * Extract menu items from the response
     */
    private static extractMenuItems(data: any, categories: any[]): any[] {
        const items: any[] = [];

        // Try to get items from categories' items
        for (const category of categories) {
            if (category.items && Array.isArray(category.items)) {
                items.push(
                    ...category.items.map((item: any) =>
                        this.transformMenuItem(item)
                    )
                );
            }
        }

        // Try to get items from menu.category.menuItems
        if (data.menu?.category?.items) {
            return data.menu.category.items.map((item: any) =>
                this.transformMenuItem(item)
            );
        }

        // If this response represents a single item, include it
        if (data.id && data.name && data.categoryId) {
            items.push(this.transformMenuItem(data));
        }

        // Also check if there's a direct menuItems array
        if (data.items && Array.isArray(data.items)) {
            items.push(
                ...data.items.map((item: any) => this.transformMenuItem(item))
            );
        }

        return items;
    }

    /**
     * Transform a single menu item to the expected format
     */
    private static transformMenuItem(item: any): any {
        return {
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: this.parsePrice(item.price),
            isVegetarian: item.isVegetarian || false,
            isVegan: item.isVegan || false,
            isGlutenFree: item.isGlutenFree || false,
            isSpicy: item.isSpicy || false,
            isAvailable: item.isAvailable ?? true,
            displayOrder: item.displayOrder || 0,
            categoryId: item.categoryId,
        };
    }

    /**
     * Parse price from string or number to number
     */
    private static parsePrice(price: string | number | undefined): number {
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
            const parsed = parseFloat(price);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    /**
     * Transform MenuFormData back to API format for saving
     */
    static toApiFormat(formData: MenuFormData): any {
        return {
            name: formData.name,
            description: formData.description,
            restaurantId: formData.restaurantId,
            isActive: formData.isActive,
            categories: formData.categories.map((category) => ({
                id: category.id.startsWith('temp-') ? undefined : category.id,
                name: category.name,
                description: category.description,
                displayOrder: category.displayOrder,
                isActive: category.isActive,
                items: category.items.map((item) => ({
                    id: item.id.startsWith('temp-') ? undefined : item.id,
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
            faqs: formData.faqs || [],
            theme: formData.theme,
        };
    }

    /**
     * Validate that we can extract the minimum required data
     */
    static validateApiResponse(response: any): boolean {
        // More lenient validation that works with your actual response structure
        const hasMenuData = !!(
            response &&
            (response.menu || response.data || response.id)
        );
        const hasRestaurantInfo = !!(
            response?.category?.restaurant ||
            response?.menu?.category?.restaurant ||
            response?.restaurant ||
            response?.restaurantId
        );

        console.log('Validation result:', {
            hasMenuData,
            hasRestaurantInfo,
            response,
        });
        return hasMenuData && hasRestaurantInfo;
    }
}
