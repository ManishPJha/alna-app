'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, Transition } from '@headlessui/react';
import { Bell, Search, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Fragment } from 'react';

interface DashboardHeaderProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role: string;
    };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const handleSignOut = () => {
        signOut({ callbackUrl: '/auth/signin' });
    };

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Search */}
                    <div className="flex flex-1 items-center">
                        <div className="relative max-w-lg w-full">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Search restaurants, users..."
                                type="search"
                            />
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-x-4">
                        {/* Notifications */}
                        <Button variant="ghost" size="sm" className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                3
                            </span>
                        </Button>

                        {/* Profile dropdown */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={user.image || undefined}
                                    />
                                    <AvatarFallback>
                                        {user.name?.charAt(0)?.toUpperCase() ||
                                            user.email
                                                ?.charAt(0)
                                                ?.toUpperCase() ||
                                            'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden lg:block text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {user.name || 'User'}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                        {user.role.toLowerCase()}
                                    </div>
                                </div>
                            </Menu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <a
                                                href="/dashboard/profile"
                                                className={`${
                                                    active ? 'bg-gray-100' : ''
                                                } flex items-center px-4 py-2 text-sm text-gray-700`}
                                            >
                                                <User className="mr-3 h-4 w-4" />
                                                Your Profile
                                            </a>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={handleSignOut}
                                                className={`${
                                                    active ? 'bg-gray-100' : ''
                                                } flex w-full items-center px-4 py-2 text-left text-sm text-gray-700`}
                                            >
                                                Sign out
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </div>
        </header>
    );
}
