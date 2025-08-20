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
