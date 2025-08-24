/* eslint-disable @typescript-eslint/no-explicit-any */
import { MenuFormData, getDefaultMenuFormData } from '@/types/menu';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export const useMenuForm = (
    apiResponse?: any,
    mode: 'create' | 'edit' = 'create'
) => {
    const form = useForm<MenuFormData>({
        defaultValues: getDefaultMenuFormData(),
        mode: 'onChange',
    });

    // Transform and set form data when API response loads
    useEffect(() => {
        console.log('useMenuForm effect triggered:', { apiResponse, mode });

        if (mode === 'edit' && apiResponse) {
            try {
                // Extract data from your API response structure
                const menu = apiResponse.menu || apiResponse;
                // const category = menu.category;
                const categories = menu.categories || [];
                const restaurant = apiResponse.restaurant || menu.restaurant;

                console.log('Extracted data:', {
                    menu,
                    categories,
                    restaurant,
                });

                if (!restaurant || !menu) {
                    console.warn('Missing required data in API response');
                    return;
                }

                // Transform to form data with new fields
                const formData: MenuFormData = {
                    id: menu.id, // Include ID for QR code generation
                    name: restaurant.name || 'Untitled Menu',
                    description: restaurant.description || '',
                    restaurantId: restaurant.id,
                    isActive: menu.isAvailable !== false,
                    // categories: [
                    //     {
                    //         id: category.id,
                    //         name: category.name,
                    //         description: category.description || '',
                    //         displayOrder: category.displayOrder || 0,
                    //         isActive: category.isActive !== false,
                    //         items: (category.menuItems || []).map(
                    //             (item: any) => ({
                    //                 id: item.id,
                    //                 name: item.name,
                    //                 description: item.description || '',
                    //                 price:
                    //                     typeof item.price === 'string'
                    //                         ? parseFloat(item.price)
                    //                         : item.price || 0,
                    //                 isVegetarian: item.isVegetarian || false,
                    //                 isVegan: item.isVegan || false,
                    //                 isGlutenFree: item.isGlutenFree || false,
                    //                 isSpicy: item.isSpicy || false,
                    //                 isAvailable: item.isAvailable !== false,
                    //                 displayOrder: item.displayOrder || 0,
                    //                 categoryId: item.categoryId,
                    //             })
                    //         ),
                    //     },
                    // ],
                    categories: categories.map((cat: any) => ({
                        id: cat.id,
                        name: cat.name,
                        description: cat.description || '',
                        displayOrder: cat.displayOrder || 0,
                        isActive: cat.isActive !== false,
                        items: (cat.items || []).map((item: any) => ({
                            id: item.id,
                            name: item.name,
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
                    })),
                    theme:
                        restaurant.menuTheme || getDefaultMenuFormData().theme,
                    faqs: menu.faqs || [], // Include FAQs from API response or empty array
                };

                console.log('Setting form data:', formData);

                // Reset form with the new data
                form.reset(formData);
            } catch (error) {
                console.error('Error processing API response:', error);
            }
        } else if (mode === 'create') {
            form.reset(getDefaultMenuFormData());
        }
    }, [apiResponse, mode, form]);

    return {
        ...form,
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors,
    };
};
