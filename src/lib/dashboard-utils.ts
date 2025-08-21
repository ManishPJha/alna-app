/* eslint-disable @typescript-eslint/no-explicit-any */
export function calculateGrowthPercentage(
    current: number,
    previous: number
): string {
    if (previous === 0) return '+100%';
    const growth = ((current - previous) / previous) * 100;
    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
}

export function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export function formatChartData(data: any[]): any[] {
    return data.map((item) => ({
        ...item,
        restaurants: Number(item.restaurants),
        qrCodes: Number(item.qrCodes),
        scans: Number(item.scans),
    }));
}

export function generateMockScanData(months: number = 6): any[] {
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        data.push({
            name: date.toLocaleDateString('en-US', { month: 'short' }),
            restaurants: Math.floor(Math.random() * 10) + 5,
            qrCodes: Math.floor(Math.random() * 50) + 20,
            scans: Math.floor(Math.random() * 1000) + 500,
        });
    }

    return data;
}
