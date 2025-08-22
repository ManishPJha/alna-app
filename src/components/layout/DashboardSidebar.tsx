import { Menu, QrCode, Settings, Store, Users } from 'lucide-react';
import { Session } from 'next-auth';

export const DashboardSidebar = ({
    activeTab,
    setActiveTab,
    currentUser,
}: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    currentUser?: Session['user'];
}) => {
    return (
        <div className="h-full">
            <nav className="p-6">
                <ul className="space-y-3">
                    <li>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                                activeTab === 'dashboard'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <Settings className="h-5 w-5 mr-3" />
                            Dashboard
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveTab('restaurants')}
                            className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                                activeTab === 'restaurants'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <Store className="h-5 w-5 mr-3" />
                            Restaurants
                        </button>
                    </li>
                    {currentUser?.role === 'ADMIN' && (
                        <li>
                            <button
                                onClick={() => setActiveTab('managers')}
                                className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                                    activeTab === 'managers'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <Users className="h-5 w-5 mr-3" />
                                Managers
                            </button>
                        </li>
                    )}
                    <li>
                        <button
                            onClick={() => setActiveTab('menus')}
                            className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                                activeTab === 'menus'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <Menu className="h-5 w-5 mr-3" />
                            Menu Management
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveTab('qr-codes')}
                            className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                                activeTab === 'qr-codes'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <QrCode className="h-5 w-5 mr-3" />
                            QR Codes
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
