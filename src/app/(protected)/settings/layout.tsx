import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings | ALNA Restaurant Management',
    description: 'Manage your profile and system settings',
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
