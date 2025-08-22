/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRouter } from 'next/navigation';

interface RecentActivityProps {
    restaurants: any[];
    users: any[];
    userRole: string;
}

export function RecentActivity({
    restaurants,
    users,
    userRole,
}: RecentActivityProps) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl px-6 py-4">
                <h3 className="text-lg font-semibold text-white">
                    Recent Activity
                </h3>
            </div>
            <div className="p-6">
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-green-100 rounded-full p-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                New restaurant &quot;Wilma Restaurant&quot;
                                added
                            </p>
                            <p className="text-sm text-gray-500">
                                Restaurant successfully onboarded with menu
                                upload capability
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            2 hours ago
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 rounded-full p-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                Menu uploaded for &quot;UGOT Bruncherie&quot;
                            </p>
                            <p className="text-sm text-gray-500">
                                PDF menu processed and ready for customer access
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            1 day ago
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 rounded-full p-2">
                            <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                QR code generated for &quot;Wilma
                                Restaurant&quot;
                            </p>
                            <p className="text-sm text-gray-500">
                                Customers can now scan QR to access digital menu
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            2 days ago
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // return (
    //     <Card>
    //         <CardHeader className="flex flex-row items-center justify-between">
    //             <CardTitle className="flex items-center">
    //                 <Activity className="h-5 w-5 mr-2" />
    //                 Recent Activity
    //             </CardTitle>

    //             <Button
    //                 variant="ghost"
    //                 size="sm"
    //                 onClick={() => router.push('/dashboard/activity')}
    //             >
    //                 View All
    //                 <ArrowRight className="h-4 w-4 ml-1" />
    //             </Button>
    //         </CardHeader>
    //         <CardContent>
    //             <div className="space-y-4">
    //                 {/* Recent Restaurants */}
    //                 <div>
    //                     <h4 className="font-medium text-gray-900 mb-3">
    //                         Recent Restaurants
    //                     </h4>
    //                     <div className="space-y-3">
    //                         {restaurants.slice(0, 3).map((restaurant) => (
    //                             <div
    //                                 key={restaurant.id}
    //                                 className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
    //                             >
    //                                 <div className="flex items-center space-x-3">
    //                                     <div
    //                                         className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
    //                                         style={{
    //                                             backgroundColor:
    //                                                 restaurant.themeColor,
    //                                         }}
    //                                     >
    //                                         {restaurant.name
    //                                             .charAt(0)
    //                                             .toUpperCase()}
    //                                     </div>
    //                                     <div>
    //                                         <p className="font-medium text-gray-900">
    //                                             {restaurant.name}
    //                                         </p>
    //                                         <p className="text-sm text-gray-500">
    //                                             Created{' '}
    //                                             {formatDate(
    //                                                 restaurant.createdAt
    //                                             )}
    //                                         </p>
    //                                     </div>
    //                                 </div>
    //                                 <div className="flex space-x-1">
    //                                     <Badge variant="secondary">
    //                                         {restaurant._count.managers}{' '}
    //                                         managers
    //                                     </Badge>
    //                                     <Badge variant="outline">
    //                                         {restaurant._count.qrCodes} QR codes
    //                                     </Badge>
    //                                 </div>
    //                             </div>
    //                         ))}
    //                     </div>
    //                 </div>

    //                 {/* Recent Users (Admin only) */}
    //                 {userRole === 'ADMIN' && users.length > 0 && (
    //                     <div>
    //                         <h4 className="font-medium text-gray-900 mb-3">
    //                             Recent Users
    //                         </h4>
    //                         <div className="space-y-3">
    //                             {users.slice(0, 3).map((user) => (
    //                                 <div
    //                                     key={user.id}
    //                                     className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
    //                                 >
    //                                     <div className="flex items-center space-x-3">
    //                                         <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
    //                                             {user.name
    //                                                 ?.charAt(0)
    //                                                 ?.toUpperCase() ||
    //                                                 user.email
    //                                                     ?.charAt(0)
    //                                                     ?.toUpperCase()}
    //                                         </div>
    //                                         <div>
    //                                             <p className="font-medium text-gray-900">
    //                                                 {user.name || user.email}
    //                                             </p>
    //                                             <p className="text-sm text-gray-500">
    //                                                 {user.restaurant?.name ||
    //                                                     'No restaurant assigned'}
    //                                             </p>
    //                                         </div>
    //                                     </div>
    //                                     <Badge
    //                                         variant={
    //                                             user.role === 'ADMIN'
    //                                                 ? 'default'
    //                                                 : 'secondary'
    //                                         }
    //                                     >
    //                                         {user.role}
    //                                     </Badge>
    //                                 </div>
    //                             ))}
    //                         </div>
    //                     </div>
    //                 )}
    //             </div>
    //         </CardContent>
    //     </Card>
    // );
}
