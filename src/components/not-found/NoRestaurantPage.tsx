export default function NoRestaurantPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    No Restaurant Assigned
                </h1>
                <p className="text-gray-600 mb-6">
                    You haven&apos;t been assigned to any restaurant yet. Please
                    contact your administrator to get access.
                </p>
                <a
                    href="/contact"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Contact Support
                </a>
            </div>
        </div>
    );
}
