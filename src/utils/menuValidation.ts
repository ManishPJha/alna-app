/* eslint-disable @typescript-eslint/no-explicit-any */
import { MenuFormData, ValidationError, ValidationResult } from '@/types/menu';

export function validateBeforeSubmit(data: MenuFormData): ValidationResult {
    const errors: ValidationError[] = [];

    // Basic required fields
    if (!data.name || data.name.trim() === '') {
        errors.push({
            field: 'name',
            message: 'Menu name is required',
        });
    }

    if (!data.restaurantId || data.restaurantId.trim() === '') {
        errors.push({
            field: 'restaurantId',
            message: 'Restaurant selection is required',
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
            if (!category.name || category.name.trim() === '') {
                errors.push({
                    field: `categories.${categoryIndex}.name`,
                    message: `Category ${categoryIndex + 1} name is required`,
                });
            }

            // Validate items in category
            if (!category.items || category.items.length === 0) {
                errors.push({
                    field: `categories.${categoryIndex}.items`,
                    message: `Category "${category.name}" must have at least one menu item`,
                });
            } else {
                category.items.forEach((item, itemIndex) => {
                    if (!item.name || item.name.trim() === '') {
                        errors.push({
                            field: `categories.${categoryIndex}.items.${itemIndex}.name`,
                            message: `Item ${itemIndex + 1} in "${
                                category.name
                            }" needs a name`,
                        });
                    }

                    if (item.price === undefined || item.price < 0) {
                        errors.push({
                            field: `categories.${categoryIndex}.items.${itemIndex}.price`,
                            message: `Item "${item.name}" needs a valid price`,
                        });
                    }
                });
            }
        });
    }

    // Theme validation
    if (data.theme) {
        if (!data.theme.primaryColor) {
            errors.push({
                field: 'theme.primaryColor',
                message: 'Primary color is required',
            });
        }

        if (!data.theme.backgroundColor) {
            errors.push({
                field: 'theme.backgroundColor',
                message: 'Background color is required',
            });
        }

        if (!data.theme.accentColor) {
            errors.push({
                field: 'theme.accentColor',
                message: 'Accent color is required',
            });
        }

        if (!data.theme.fontFamily) {
            errors.push({
                field: 'theme.fontFamily',
                message: 'Font family is required',
            });
        }
    }

    // FAQs validation (optional but if provided, should be valid)
    if (data.faqs) {
        data.faqs.forEach((faq, faqIndex) => {
            if (faq.question && !faq.answer) {
                errors.push({
                    field: `faqs.${faqIndex}.answer`,
                    message: `FAQ ${faqIndex + 1} question needs an answer`,
                });
            }

            if (faq.answer && !faq.question) {
                errors.push({
                    field: `faqs.${faqIndex}.question`,
                    message: `FAQ ${faqIndex + 1} answer needs a question`,
                });
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function validateCategory(category: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!category.name || category.name.trim() === '') {
        errors.push({
            field: 'name',
            message: 'Category name is required',
        });
    }

    return errors;
}

export function validateMenuItem(item: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!item.name || item.name.trim() === '') {
        errors.push({
            field: 'name',
            message: 'Item name is required',
        });
    }

    if (item.price === undefined || item.price < 0) {
        errors.push({
            field: 'price',
            message: 'Valid price is required',
        });
    }

    return errors;
}

export type { ValidationError, ValidationResult };
