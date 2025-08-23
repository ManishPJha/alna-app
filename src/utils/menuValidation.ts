import { MenuFormData } from '@/types/menu';

export interface ValidationError {
    field: string;
    message: string;
}

export const validateMenuForm = (data: MenuFormData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Basic menu information validation
    if (!data.name || data.name.trim().length === 0) {
        errors.push({
            field: 'name',
            message: 'Menu name is required',
        });
    } else if (data.name.trim().length < 2) {
        errors.push({
            field: 'name',
            message: 'Menu name must be at least 2 characters',
        });
    } else if (data.name.trim().length > 100) {
        errors.push({
            field: 'name',
            message: 'Menu name cannot exceed 100 characters',
        });
    }

    if (!data.restaurantId || data.restaurantId.trim().length === 0) {
        errors.push({
            field: 'restaurantId',
            message: 'Please select a restaurant',
        });
    }

    if (data.description && data.description.length > 500) {
        errors.push({
            field: 'description',
            message: 'Description cannot exceed 500 characters',
        });
    }

    // Theme validation
    if (!isValidHexColor(data.theme.primaryColor)) {
        errors.push({
            field: 'theme.primaryColor',
            message: 'Primary color must be a valid hex color (e.g., #1f2937)',
        });
    }

    if (!isValidHexColor(data.theme.backgroundColor)) {
        errors.push({
            field: 'theme.backgroundColor',
            message:
                'Background color must be a valid hex color (e.g., #f9fafb)',
        });
    }

    if (!isValidHexColor(data.theme.accentColor)) {
        errors.push({
            field: 'theme.accentColor',
            message: 'Accent color must be a valid hex color (e.g., #ef4444)',
        });
    }

    if (!data.theme.fontFamily || data.theme.fontFamily.trim().length === 0) {
        errors.push({
            field: 'theme.fontFamily',
            message: 'Font family is required',
        });
    }

    // Categories validation
    if (!data.categories || data.categories.length === 0) {
        errors.push({
            field: 'categories',
            message: 'At least one category is required',
        });
    } else {
        // Validate each category
        data.categories.forEach((category, categoryIndex) => {
            if (!category.name || category.name.trim().length === 0) {
                errors.push({
                    field: `categories.${categoryIndex}.name`,
                    message: `Category ${categoryIndex + 1} name is required`,
                });
            } else if (category.name.trim().length > 50) {
                errors.push({
                    field: `categories.${categoryIndex}.name`,
                    message: `Category ${
                        categoryIndex + 1
                    } name cannot exceed 50 characters`,
                });
            }

            if (category.description && category.description.length > 200) {
                errors.push({
                    field: `categories.${categoryIndex}.description`,
                    message: `Category ${
                        categoryIndex + 1
                    } description cannot exceed 200 characters`,
                });
            }

            // Validate items in each category
            if (!category.items || category.items.length === 0) {
                errors.push({
                    field: `categories.${categoryIndex}.items`,
                    message: `Category "${category.name}" must have at least one item`,
                });
            } else {
                category.items.forEach((item, itemIndex) => {
                    if (!item.name || item.name.trim().length === 0) {
                        errors.push({
                            field: `categories.${categoryIndex}.items.${itemIndex}.name`,
                            message: `Item ${itemIndex + 1} in "${
                                category.name
                            }" requires a name`,
                        });
                    } else if (item.name.trim().length > 100) {
                        errors.push({
                            field: `categories.${categoryIndex}.items.${itemIndex}.name`,
                            message: `Item ${itemIndex + 1} in "${
                                category.name
                            }" name cannot exceed 100 characters`,
                        });
                    }

                    if (item.description && item.description.length > 300) {
                        errors.push({
                            field: `categories.${categoryIndex}.items.${itemIndex}.description`,
                            message: `Item ${itemIndex + 1} in "${
                                category.name
                            }" description cannot exceed 300 characters`,
                        });
                    }

                    if (item.price < 0) {
                        errors.push({
                            field: `categories.${categoryIndex}.items.${itemIndex}.price`,
                            message: `Item ${itemIndex + 1} in "${
                                category.name
                            }" price cannot be negative`,
                        });
                    } else if (item.price > 99999) {
                        errors.push({
                            field: `categories.${categoryIndex}.items.${itemIndex}.price`,
                            message: `Item ${itemIndex + 1} in "${
                                category.name
                            }" price cannot exceed 99,999`,
                        });
                    }
                });
            }
        });

        // Check for duplicate category names
        const categoryNames = data.categories.map((cat) =>
            cat.name.trim().toLowerCase()
        );
        const duplicateCategories = categoryNames.filter(
            (name, index) => categoryNames.indexOf(name) !== index
        );

        if (duplicateCategories.length > 0) {
            errors.push({
                field: 'categories',
                message: 'Category names must be unique',
            });
        }
    }

    return errors;
};

const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
};

export const validateBeforeSubmit = (
    data: MenuFormData
): { isValid: boolean; errors: ValidationError[] } => {
    const errors = validateMenuForm(data);
    return {
        isValid: errors.length === 0,
        errors,
    };
};
