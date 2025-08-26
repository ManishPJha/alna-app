export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-4">
                    <svg
                        className="mx-auto h-12 w-12 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Access Denied
                </h1>
                <p className="text-gray-600 mb-6">
                    You don&apos;t have permission to access this page. Please
                    contact your administrator if you believe this is an error.
                </p>
                <div className="space-y-3">
                    <a
                        href="/dashboard"
                        className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Go to Dashboard
                    </a>
                    <a
                        href="/contact"
                        className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
