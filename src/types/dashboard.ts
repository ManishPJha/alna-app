export interface DashboardStats {
    restaurants: number;
    users: number;
    qrCodes: number;
    activeMenus: number;
}

export interface MonthlyData {
    name: string;
    restaurants: number;
    qrCodes: number;
    scans: number;
}

export interface RecentRestaurant {
    id: string;
    name: string;
    themeColor: string;
    createdAt: string;
    _count: {
        managers: number;
        qrCodes: number;
        menuItems: number;
    };
}

export interface RecentUser {
    id: string;
    name?: string;
    email: string;
    role: string;
    restaurant?: {
        name: string;
    };
}

export interface DashboardData {
    stats: DashboardStats;
    recentRestaurants: RecentRestaurant[];
    recentUsers: RecentUser[];
    monthlyStats: MonthlyData[];
}
