import { MenuDataTransformer } from '@/service/menuDataTransformer';
import { MenuFormData, getDefaultMenuFormData } from '@/types/menu';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export const useMenuForm = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiResponse?: any,
    mode: 'create' | 'edit' = 'create'
) => {
    const form = useForm<MenuFormData>({
        defaultValues: getDefaultMenuFormData(),
        mode: 'onChange',
    });

    // Transform and set form data when API response loads
    useEffect(() => {
        if (mode === 'edit' && apiResponse) {
            try {
                // Use the MenuDataTransformer for consistent data transformation
                const transformedData =
                    MenuDataTransformer.fromApiResponse(apiResponse);

                // Reset form with the transformed data
                form.reset(transformedData);
            } catch (error) {
                console.error(
                    'Error processing API response in useMenuForm:',
                    error
                );

                // Fallback to default data if transformation fails
                form.reset(getDefaultMenuFormData());
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
