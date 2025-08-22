// hooks/useMenuEditor.ts
import {
    createMenuCategory,
    createMenuItem,
    deleteMenuCategory,
    deleteMenuItem,
    saveMenuChanges,
    updateMenuCategory,
    updateMenuItem,
} from '@/actions/menu';
import {
    MenuCategory,
    MenuEditorAction,
    MenuEditorState,
    MenuItem,
    MenuTheme,
    RestaurantMenu,
} from '@/types/menu';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { toast } from 'sonner'; // or your preferred toast library

// Initial state
const initialState: MenuEditorState = {
    restaurant: {
        id: '',
        name: '',
        description: '',
        menuTheme: {
            primaryColor: '#1f2937',
            backgroundColor: '#f9fafb',
            accentColor: '#ef4444',
            fontFamily: 'Inter',
        },
        isMenuPublished: false,
        menuVersion: 1,
        categories: [],
    },
    categories: [],
    activeTab: 'content',
    searchTerm: '',
    isDirty: false,
    isSaving: false,
};

// Reducer function
function menuEditorReducer(
    state: MenuEditorState,
    action: MenuEditorAction
): MenuEditorState {
    switch (action.type) {
        case 'SET_RESTAURANT':
            return {
                ...state,
                restaurant: action.payload,
                isDirty: false,
            };

        case 'SET_CATEGORIES':
            return {
                ...state,
                categories: action.payload,
                isDirty: false,
            };

        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };

        case 'SET_SEARCH_TERM':
            return { ...state, searchTerm: action.payload };

        case 'SET_DIRTY':
            return { ...state, isDirty: action.payload };

        case 'SET_SAVING':
            return { ...state, isSaving: action.payload };

        case 'SET_LAST_SAVED':
            return { ...state, lastSaved: action.payload };

        case 'ADD_CATEGORY':
            return {
                ...state,
                categories: [...state.categories, action.payload],
                isDirty: true,
            };

        case 'UPDATE_CATEGORY':
            return {
                ...state,
                categories: state.categories.map((cat) =>
                    cat.id === action.payload.id
                        ? { ...cat, ...action.payload.updates }
                        : cat
                ),
                isDirty: true,
            };

        case 'DELETE_CATEGORY':
            return {
                ...state,
                categories: state.categories.filter(
                    (cat) => cat.id !== action.payload
                ),
                isDirty: true,
            };

        case 'ADD_ITEM':
            return {
                ...state,
                categories: state.categories.map((cat) =>
                    cat.id === action.payload.categoryId
                        ? { ...cat, items: [...cat.items, action.payload.item] }
                        : cat
                ),
                isDirty: true,
            };

        case 'UPDATE_ITEM':
            return {
                ...state,
                categories: state.categories.map((cat) =>
                    cat.id === action.payload.categoryId
                        ? {
                              ...cat,
                              items: cat.items.map((item) =>
                                  item.id === action.payload.itemId
                                      ? { ...item, ...action.payload.updates }
                                      : item
                              ),
                          }
                        : cat
                ),
                isDirty: true,
            };

        case 'DELETE_ITEM':
            return {
                ...state,
                categories: state.categories.map((cat) =>
                    cat.id === action.payload.categoryId
                        ? {
                              ...cat,
                              items: cat.items.filter(
                                  (item) => item.id !== action.payload.itemId
                              ),
                          }
                        : cat
                ),
                isDirty: true,
            };

        case 'UPDATE_THEME':
            return {
                ...state,
                restaurant: {
                    ...state.restaurant,
                    menuTheme: {
                        ...state.restaurant.menuTheme,
                        ...action.payload,
                    },
                },
                isDirty: true,
            };

        default:
            return state;
    }
}

export function useMenuEditor(initialData?: {
    restaurant: RestaurantMenu;
    categories: MenuCategory[];
}) {
    const [state, dispatch] = useReducer(menuEditorReducer, {
        ...initialState,
        restaurant: initialData?.restaurant || initialState.restaurant,
        categories: initialData?.categories || initialState.categories,
    });

    const router = useRouter();
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>(null);

    // Auto-save functionality
    useEffect(() => {
        if (state.isDirty && !state.isSaving) {
            // Clear existing timeout
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Set new timeout for auto-save (5 seconds after last change)
            autoSaveTimeoutRef.current = setTimeout(() => {
                handleSave();
            }, 5000);
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [state.isDirty, state.isSaving]);

    // Restaurant actions
    const updateRestaurant = useCallback(
        (updates: Partial<RestaurantMenu>) => {
            dispatch({
                type: 'SET_RESTAURANT',
                payload: { ...state.restaurant, ...updates },
            });
        },
        [state.restaurant]
    );

    const updateTheme = useCallback((updates: Partial<MenuTheme>) => {
        dispatch({ type: 'UPDATE_THEME', payload: updates });
    }, []);

    // Category actions
    const addCategory = useCallback(async () => {
        const tempId = `temp-cat-${Date.now()}`;
        const newCategory: MenuCategory = {
            id: tempId,
            restaurantId: state.restaurant.id,
            name: 'New Category',
            description: '',
            displayOrder: state.categories.length,
            isActive: true,
            isVisible: true,
            items: [],
        };

        dispatch({ type: 'ADD_CATEGORY', payload: newCategory });

        // Optimistically add, then sync with server
        try {
            const result = await createMenuCategory(state.restaurant.id, {
                name: newCategory.name,
                description: newCategory.description,
                displayOrder: newCategory.displayOrder,
                isActive: newCategory.isActive,
                isVisible: newCategory.isVisible,
            });

            if (result.success && result.data) {
                // Update with real ID from server
                dispatch({
                    type: 'UPDATE_CATEGORY',
                    payload: {
                        id: tempId,
                        updates: { id: result.data.id },
                    },
                });
            }
        } catch (error) {
            // Revert optimistic update on error
            dispatch({ type: 'DELETE_CATEGORY', payload: tempId });
            toast.error('Failed to create category');
        }
    }, [state.restaurant.id, state.categories.length]);

    const updateCategory = useCallback(
        async (categoryId: string, updates: Partial<MenuCategory>) => {
            // Optimistic update
            dispatch({
                type: 'UPDATE_CATEGORY',
                payload: { id: categoryId, updates },
            });

            try {
                const result = await updateMenuCategory(categoryId, updates);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } catch (error) {
                toast.error('Failed to update category');
                // Could implement revert logic here
            }
        },
        []
    );

    const deleteCategory = useCallback(
        async (categoryId: string) => {
            const categoryToDelete = state.categories.find(
                (cat) => cat.id === categoryId
            );

            // Optimistic delete
            dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });

            try {
                const result = await deleteMenuCategory(categoryId);
                if (!result.success) {
                    throw new Error(result.error);
                }
                toast.success('Category deleted');
            } catch (error) {
                // Revert on error
                if (categoryToDelete) {
                    dispatch({
                        type: 'ADD_CATEGORY',
                        payload: categoryToDelete,
                    });
                }
                toast.error('Failed to delete category');
            }
        },
        [state.categories]
    );

    // Item actions
    const addItem = useCallback(async (categoryId: string) => {
        const tempId = `temp-item-${Date.now()}`;
        const newItem: MenuItem = {
            id: tempId,
            categoryId,
            name: 'New Item',
            description: '',
            price: 0,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            isSpicy: false,
            spiceLevel: 0,
            isBestseller: false,
            isAvailable: true,
            isVisible: true,
            displayOrder: 0,
            tags: [],
        };

        dispatch({
            type: 'ADD_ITEM',
            payload: { categoryId, item: newItem },
        });

        try {
            const result = await createMenuItem(categoryId, {
                name: newItem.name,
                description: newItem.description,
                price: newItem.price,
                isVegetarian: newItem.isVegetarian,
                isVegan: newItem.isVegan,
                isGlutenFree: newItem.isGlutenFree,
                isSpicy: newItem.isSpicy,
                spiceLevel: newItem.spiceLevel,
                isBestseller: newItem.isBestseller,
                isAvailable: newItem.isAvailable,
                displayOrder: newItem.displayOrder,
                categoryId: newItem.categoryId,
                tags: newItem.tags,
                isVisible: newItem.isVisible,
            });

            if (result.success && result.data) {
                // Update with real ID from server
                dispatch({
                    type: 'UPDATE_ITEM',
                    payload: {
                        categoryId,
                        itemId: tempId,
                        updates: { id: result.data.id },
                    },
                });
            }
        } catch (error) {
            // Revert optimistic update
            dispatch({
                type: 'DELETE_ITEM',
                payload: { categoryId, itemId: tempId },
            });
            toast.error('Failed to create item');
        }
    }, []);

    const updateItem = useCallback(
        async (
            categoryId: string,
            itemId: string,
            updates: Partial<MenuItem>
        ) => {
            // Optimistic update
            dispatch({
                type: 'UPDATE_ITEM',
                payload: { categoryId, itemId, updates },
            });

            try {
                const result = await updateMenuItem(itemId, updates);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } catch (error) {
                toast.error('Failed to update item');
                // Could implement revert logic here
            }
        },
        []
    );

    const deleteItem = useCallback(
        async (categoryId: string, itemId: string) => {
            const category = state.categories.find(
                (cat) => cat.id === categoryId
            );
            const itemToDelete = category?.items.find(
                (item) => item.id === itemId
            );

            // Optimistic delete
            dispatch({
                type: 'DELETE_ITEM',
                payload: { categoryId, itemId },
            });

            try {
                const result = await deleteMenuItem(itemId);
                if (!result.success) {
                    throw new Error(result.error);
                }
                toast.success('Item deleted');
            } catch (error) {
                // Revert on error
                if (itemToDelete) {
                    dispatch({
                        type: 'ADD_ITEM',
                        payload: { categoryId, item: itemToDelete },
                    });
                }
                toast.error('Failed to delete item');
            }
        },
        [state.categories]
    );

    // Save functionality
    const handleSave = useCallback(async () => {
        if (!state.isDirty || state.isSaving) return;

        dispatch({ type: 'SET_SAVING', payload: true });

        try {
            const result = await saveMenuChanges(state.restaurant.id, {
                restaurant: {
                    name: state.restaurant.name,
                    description: state.restaurant.description,
                    menuTheme: state.restaurant.menuTheme,
                },
                // In a real implementation, you'd track which items changed
                // and only send those changes
            });

            if (result.success) {
                dispatch({ type: 'SET_DIRTY', payload: false });
                dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
                toast.success('Changes saved');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error('Failed to save changes');
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [state.isDirty, state.isSaving, state.restaurant]);

    // UI actions
    const setActiveTab = useCallback((tab: typeof state.activeTab) => {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    }, []);

    const setSearchTerm = useCallback((term: string) => {
        dispatch({ type: 'SET_SEARCH_TERM', payload: term });
    }, []);

    // Filtered data for UI
    const filteredCategories = useCallback(() => {
        if (!state.searchTerm) return state.categories;

        return state.categories.filter(
            (category) =>
                category.name
                    .toLowerCase()
                    .includes(state.searchTerm.toLowerCase()) ||
                category.description
                    ?.toLowerCase()
                    .includes(state.searchTerm.toLowerCase()) ||
                category.items.some(
                    (item) =>
                        item.name
                            .toLowerCase()
                            .includes(state.searchTerm.toLowerCase()) ||
                        item.description
                            .toLowerCase()
                            .includes(state.searchTerm.toLowerCase())
                )
        );
    }, [state.categories, state.searchTerm]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+S or Cmd+S to save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (state.isDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [state.isDirty]);

    return {
        // State
        ...state,
        filteredCategories: filteredCategories(),

        // Restaurant actions
        updateRestaurant,
        updateTheme,

        // Category actions
        addCategory,
        updateCategory,
        deleteCategory,

        // Item actions
        addItem,
        updateItem,
        deleteItem,

        // UI actions
        setActiveTab,
        setSearchTerm,

        // Save actions
        handleSave,

        // Computed values
        hasUnsavedChanges: state.isDirty,
        canSave: state.isDirty && !state.isSaving,
    };
}
