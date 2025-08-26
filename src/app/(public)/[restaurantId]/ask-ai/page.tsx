import { RestaurantMenuPage } from '@/features/restaurant/';

interface AskAiByRestaurantPageProps {
    params: Promise<{ restaurantId: string }>;
}

export default async function AskAiByRestaurantPage({
    params,
}: AskAiByRestaurantPageProps) {
    const { restaurantId } = await params;

    return <RestaurantMenuPage restaurantId={restaurantId} />;
}
