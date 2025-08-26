import { notFound } from 'next/navigation';
import { MenuView } from '../../../../features/menu/components/MenuView';

interface MenuPageProps {
    params: Promise<{ id: string }>;
}

export default async function MenuPage({ params }: MenuPageProps) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    return <MenuView menuId={id} />;
} 