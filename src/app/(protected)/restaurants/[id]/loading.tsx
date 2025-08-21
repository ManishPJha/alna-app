export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="animate-pulse">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>

                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-lg border">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div className="ml-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content skeleton */}
                <div className="bg-white rounded-lg border p-6">
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}
