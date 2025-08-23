// import { RestaurantDetailsView } from '@/components/restaurants/restaurant-details-view';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface RestaurantPageProps {
    params: { id: string };
}

async function getRestaurant(id: string, userId: string, userRole: string) {
    // Build query based on user role
    const whereClause =
        userRole === 'ADMIN'
            ? { id }
            : {
                  id,
                  managers: {
                      some: { id: userId },
                  },
              };

    const restaurant = await db.restaurant.findUnique({
        where: whereClause,
        include: {
            managers: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                },
            },
            qrCodes: {
                take: 10,
                orderBy: { createdAt: 'desc' },
            },
            menuItems: {
                take: 10,
                orderBy: { createdAt: 'desc' },
            },
            _count: {
                select: {
                    managers: true,
                    qrCodes: true,
                    menuItems: true,
                },
            },
        },
    });

    if (!restaurant) {
        notFound();
    }

    return restaurant;
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
    // const restaurant = await getRestaurant(
    //     params.id,
    //     session.user.id,
    //     session.user.role
    // );

    return (
        <div className="space-y-6">
            {/* <RestaurantDetailsView restaurant={restaurant} /> */}
        </div>
    );
}
