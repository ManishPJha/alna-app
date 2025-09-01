interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: 'ADMIN' | 'MANAGER' | 'USER';
    isActive: boolean;
    restaurantId: string | null;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    restaurant?: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        description: string | null;
        defaultLanguage: string;
        timezone: string;
        logoUrl: string | null;
        themeColor: string;
    } | null;
}

export interface SettingsPageClientProps {
    user: User;
}
