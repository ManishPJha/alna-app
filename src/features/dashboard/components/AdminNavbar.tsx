import { logOutAction } from '@/actions/auth';
import { formatText } from '@/utils/formatter';
import { Session } from 'next-auth';
import AppImage from '../../shared/components/ui/image';

const AdminNavbar = ({ currentUser }: { currentUser?: Session['user'] }) => {
    return (
        <header className="bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        {/* <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-2 mr-4"> */}
                        {/* <Menu className="h-8 w-8 text-white" /> */}
                        <div className="mr-4">
                            <AppImage
                                src="/alna_logo.png"
                                alt="Logo"
                                width={80}
                                height={80}
                                withBorder
                            />
                        </div>
                        {/* </div> */}
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
                        <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-xl text-sm font-semibold border border-indigo-200">
                            {formatText(currentUser?.role || '')}
                        </span>
                        <button
                            onClick={() => logOutAction()}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold border border-indigo-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminNavbar;
