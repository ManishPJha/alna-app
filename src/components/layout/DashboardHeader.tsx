import { logOutAction } from '@/actions/auth';
import AppImage from '@/shared/components/ui/image';
import { formatText } from '@/utils/formatter';
import { Session } from 'next-auth';

export const DashboardHeader = ({
    currentUser,
}: {
    currentUser?: Session['user'];
}) => {
    return (
        <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <div className="mr-4">
                            <AppImage
                                src="/alna_logo.png"
                                alt="Logo"
                                width={60}
                                height={60}
                                withBorder
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-indigo-600">
                                ALNA Menu Admin
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Digital Menu Management System
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <span className="text-sm text-gray-600">
                                Welcome back,
                            </span>
                            <p className="font-semibold text-gray-900">
                                {currentUser?.name}
                            </p>
                        </div>
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-xl text-sm font-semibold border border-indigo-200">
                            {formatText(currentUser?.role || '')}
                        </span>
                        <button
                            onClick={() => logOutAction()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
