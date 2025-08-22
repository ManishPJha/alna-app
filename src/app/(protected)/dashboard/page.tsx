import { getSession } from '@/features/auth';
import {
    // DashboardCharts,
    DashboardStats,
    // QuickActions,
    RecentActivity,
    WelcomeSection,
} from '@/features/dashboard';
import { db } from '@/lib/db';
import { Suspense } from 'react';

// Server-side data fetching for dashboard overview
async function getDashboardData(userId: string, userRole: string) {
    const whereClause =
        userRole === 'ADMIN'
            ? {}
            : {
                  OR: [
                      { managers: { some: { id: userId } } },
                      { id: { in: await getUserRestaurantIds(userId) } },
                  ],
              };

    const [
        restaurantsCount,
        usersCount,
        qrCodesCount,
        recentRestaurants,
        recentUsers,
        monthlyStats,
    ] = await Promise.all([
        // Total restaurants count
        db.restaurant.count({ where: whereClause }),

        // Total users count (admin only)
        userRole === 'ADMIN' ? db.user.count({ where: { isActive: true } }) : 0,

        // Total QR codes count
        db.qRCode.count({
            where: userRole === 'ADMIN' ? {} : { restaurant: whereClause },
        }),

        // Recent restaurants
        db.restaurant.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                _count: {
                    select: {
                        managers: true,
                        qrCodes: true,
                        menuItems: true,
                    },
                },
            },
        }),

        // Recent users (admin only)
        userRole === 'ADMIN'
            ? db.user.findMany({
                  where: { isActive: true },
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                  include: {
                      restaurant: {
                          select: { name: true },
                      },
                  },
              })
            : [],

        // Monthly statistics
        getMonthlyStats(userRole, userId),
    ]);

    return {
        stats: {
            restaurants: restaurantsCount,
            users: usersCount,
            qrCodes: qrCodesCount,
            activeMenus: await getActiveMenusCount(whereClause),
        },
        recentRestaurants,
        recentUsers,
        monthlyStats,
    };
}

async function getUserRestaurantIds(userId: string) {
    if (!userId) return [];

    const user = await db.user.findUnique({
        where: { id: userId },
        include: { restaurant: true },
    });
    return user?.restaurant ? [user.restaurant.id] : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getActiveMenusCount(whereClause: any) {
    return db.restaurant.count({
        where: {
            ...whereClause,
            menuItems: {
                some: {
                    isAvailable: true,
                },
            },
        },
    });
}

async function getMonthlyStats(userRole: string, userId: string) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get data for the last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return {
            name: date.toLocaleDateString('en-US', { month: 'short' }),
            date,
        };
    }).reverse();

    const statsPromises = months.map(async (month) => {
        const nextMonth = new Date(
            month.date.getFullYear(),
            month.date.getMonth() + 1,
            1
        );

        const whereClause =
            userRole === 'ADMIN'
                ? {
                      createdAt: {
                          gte: month.date,
                          lt: nextMonth,
                      },
                  }
                : {
                      createdAt: {
                          gte: month.date,
                          lt: nextMonth,
                      },
                      OR: [
                          { managers: { some: { id: userId } } },
                          { id: { in: await getUserRestaurantIds(userId) } },
                      ],
                  };

        const [restaurants, qrCodes] = await Promise.all([
            db.restaurant.count({ where: whereClause }),
            db.qRCode.count({
                where:
                    userRole === 'ADMIN'
                        ? {
                              createdAt: {
                                  gte: month.date,
                                  lt: nextMonth,
                              },
                          }
                        : {
                              createdAt: {
                                  gte: month.date,
                                  lt: nextMonth,
                              },
                              restaurant: whereClause,
                          },
            }),
        ]);

        return {
            name: month.name,
            restaurants,
            qrCodes,
            scans: Math.floor(Math.random() * 1000) + 500, // Mock data for now
        };
    });

    return Promise.all(statsPromises);
}

export default async function DashboardPage() {
    // const session = await getServerSession(authConfig);
    const session = await getSession();

    if (!session) {
        return null; // This should be handled by middleware
    }

    const dashboardData = await getDashboardData(
        session.user.id,
        session.user.role
    );

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <WelcomeSection user={session.user} />

            {/* Stats Overview */}
            <Suspense fallback={<StatsLoadingSkeleton />}>
                <DashboardStats
                    stats={dashboardData.stats}
                    userRole={session.user.role}
                />
            </Suspense>

            {/* Charts and Analytics */}
            {/* <Suspense fallback={<ChartsLoadingSkeleton />}>
                <DashboardCharts
                    data={dashboardData.monthlyStats}
                    userRole={session.user.role}
                />
            </Suspense> */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                {/* <div className="lg:col-span-1">
                    <QuickActions userRole={session.user.role} />
                </div> */}

                {/* Recent Activity */}
                <div className="lg:col-span-3">
                    <Suspense fallback={<ActivityLoadingSkeleton />}>
                        <RecentActivity
                            restaurants={dashboardData.recentRestaurants}
                            users={dashboardData.recentUsers}
                            userRole={session.user.role}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

// Loading skeletons
function StatsLoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white p-6 rounded-lg border animate-pulse"
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// function ChartsLoadingSkeleton() {
//     return (
//         <div className="bg-white p-6 rounded-lg border animate-pulse">
//             <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
//             <div className="h-64 bg-gray-200 rounded"></div>
//         </div>
//     );
// }

function ActivityLoadingSkeleton() {
    return (
        <div className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
