/* eslint-disable @typescript-eslint/no-explicit-any */
import { Menu } from '@/types/api';
import { MenuFormData, getDefaultMenuFormData } from '@/types/menu';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

// Helper function to transform API response to form data
const transformApiResponseToFormData = (
    apiResponse: any
): MenuFormData | null => {
    if (!apiResponse?.menu) return null;

    const menuItem = apiResponse.menu;
    const category = menuItem.category;
    const restaurant = category?.restaurant;

    // Transform the single menu item API response into a proper menu structure
    const transformedData: MenuFormData = {
        name: restaurant?.name || 'Untitled Menu',
        description: restaurant?.description || '',
        restaurantId: restaurant?.id || menuItem.restaurantId || '',
        isActive: menuItem.isAvailable ?? true,
        categories: category
            ? [
                  {
                      id: category.id,
                      name: category.name,
                      description: category.description || '',
                      displayOrder: category.displayOrder || 0,
                      isActive: category.isActive ?? true,
                      items:
                          category.menuItems?.map((item: any) => ({
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
                              isAvailable: item.isAvailable ?? true,
                              displayOrder: item.displayOrder || 0,
                              categoryId: item.categoryId,
                          })) || [],
                  },
              ]
            : [],
        theme: restaurant?.menuTheme || getDefaultMenuFormData().theme,
    };

    return transformedData;
};

export const useMenuForm = (
    menu?: Menu | any | null, // Accept any to handle your API response structure
    mode: 'create' | 'edit' = 'create'
) => {
    const form = useForm<MenuFormData>({
        defaultValues: getDefaultMenuFormData(),
        mode: 'onChange',
    });

    // Sync form when menu data loads
    useEffect(() => {
        if (mode === 'edit' && menu) {
            let formData: MenuFormData;

            // Check if menu is already in the correct format or needs transformation
            if (menu.categories && Array.isArray(menu.categories)) {
                // Menu is in correct format
                formData = {
                    name: menu.name || '',
                    description: menu.description || '',
                    restaurantId: menu.restaurantId || '',
                    isActive: menu.isActive ?? true,
                    categories: menu.categories || [],
                    theme: menu.theme || getDefaultMenuFormData().theme,
                };
            } else {
                // Menu is in API response format, transform it
                const transformed = transformApiResponseToFormData(menu);
                if (!transformed) {
                    console.error('Failed to transform menu data:', menu);
                    return;
                }
                formData = transformed;
            }

            console.log('Setting form data:', formData);
            form.reset(formData);
        } else if (mode === 'create') {
            form.reset(getDefaultMenuFormData());
        }
    }, [menu, mode, form]);

    return {
        ...form,
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors,
    };
};
