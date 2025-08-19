import { paths } from '@/config/routes';
import { getSession, PublicSessionProvider } from '@/features/auth';
import { getLanguage, TranslationProvider } from '@/features/i18n';
import { redirect, RedirectType } from 'next/navigation';
import LayoutComponent from './_components/LayoutComponent';

const I18N_NAMESPACES = ['home', 'translation'];

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [session, language] = await Promise.all([
        getSession(),
        getLanguage(),
    ]);

    const excludePaths = [paths.signIn, paths.signUp];

    if (session?.user) {
        redirect(paths.homePage, RedirectType.replace);
    }

    // We still want to provide a session to the context
    // to preserve auth state during authentication flows
    return (
        <PublicSessionProvider session={session}>
            <TranslationProvider
                language={language}
                namespaces={I18N_NAMESPACES}
            >
                <LayoutComponent
                    children={children}
                    excludePaths={excludePaths}
                />
            </TranslationProvider>
        </PublicSessionProvider>
    );
}
