export const restaurants = [
    {
        id: 1,
        name: 'Wilma Restaurant',
        address: '123 Main St, City',
        manager: 'John Doe',
        status: 'active',
        qr_code: 'QR001',
        menu_uploaded: true,
        created_at: '2025-01-15',
    },
    {
        id: 2,
        name: 'UGOT Bruncherie',
        address: '456 Oak Ave, City',
        manager: 'Jane Smith',
        status: 'active',
        qr_code: 'QR002',
        menu_uploaded: true,
        created_at: '2025-01-10',
    },
];

export const managers = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@wilma.com',
        restaurant: 'Wilma Restaurant',
        status: 'active',
        created_at: '2025-01-15',
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@ugot.com',
        restaurant: 'UGOT Bruncherie',
        status: 'active',
        created_at: '2025-01-10',
    },
];

export const categories = [
    {
        id: 'cat-1',
        name: 'Appetizers',
        description: 'Perfect starters to begin your culinary journey',
        displayOrder: 1,
        isActive: true,
        items: [
            {
                id: 'item-1',
                name: 'Burrata with Heirloom Tomatoes',
                description:
                    'Creamy burrata served with seasonal heirloom tomatoes, fresh basil, and aged balsamic',
                price: 18,
                isVegetarian: true,
                isVegan: false,
                isGlutenFree: true,
                isSpicy: false,
                isAvailable: true,
                displayOrder: 1,
                categoryId: 'cat-1',
            },
        ],
    },
    {
        id: 'cat-2',
        name: 'Main Courses',
        description: 'Signature dishes crafted with the finest ingredients',
        displayOrder: 2,
        isActive: true,
        items: [
            {
                id: 'item-2',
                name: 'Pan-Seared Duck Breast',
                description:
                    'Five-spice duck breast with cherry gastrique, roasted fingerling potatoes, and seasonal vegetables',
                price: 32,
                isVegetarian: false,
                isVegan: false,
                isGlutenFree: true,
                isSpicy: false,
                isAvailable: true,
                displayOrder: 1,
                categoryId: 'cat-2',
            },
        ],
    },
];
