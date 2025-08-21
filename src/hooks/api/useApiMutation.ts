import { ApiResponse } from '@/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseApiMutationOptions<TData, TVariables> {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: string, variables: TVariables) => void;
    invalidateQueries?: string[];
    successMessage?: string;
    errorMessage?: string;
}

export function useApiMutation<TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
    options: UseApiMutationOptions<TData, TVariables> = {}
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: TVariables) => {
            const result = await mutationFn(variables);

            if (!result.success) {
                throw new Error(result.error || 'Operation failed');
            }

            return result.data!;
        },
        onSuccess: (data, variables) => {
            // Invalidate specified queries
            if (options.invalidateQueries) {
                options.invalidateQueries.forEach((queryKey) => {
                    queryClient.invalidateQueries({ queryKey: [queryKey] });
                });
            }

            // Show success message
            if (options.successMessage) {
                toast.success(options.successMessage);
            }

            // Call custom success handler
            options.onSuccess?.(data, variables);
        },
        onError: (error: Error, variables) => {
            // Show error message
            const errorMessage = options.errorMessage || error.message;
            toast.error(errorMessage);

            // Call custom error handler
            options.onError?.(error.message, variables);
        },
    });
}
