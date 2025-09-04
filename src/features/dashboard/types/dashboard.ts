export interface DashboardStatsProps {
    stats: {
        restaurants: number;
        users: number;
        qrCodes: number;
        activeMenus: number;
        orders: number;
    };
    userRole: string;
}
