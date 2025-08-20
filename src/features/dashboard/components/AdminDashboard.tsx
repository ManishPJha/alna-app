'use client';

import { AdminNavbar, AdminSidebar } from '@/features/dashboard';
import { useRestaurants, useUsers } from '@/hooks';
import type { Restaurant, User } from '@/types/api';
import { formatDate } from '@/utils/formatter';
import {
    Activity,
    Edit,
    Eye,
    Menu,
    Plus,
    QrCode,
    Store,
    Trash2,
    TrendingUp,
    Upload,
    Users,
} from 'lucide-react';
import { type Session } from 'next-auth';
import React, { useState } from 'react';

const AdminDashboard: React.FC<{ currentUser?: Session['user'] }> = ({
    currentUser,
}) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'restaurant' | 'user' | ''>('');
    const [editingItem, setEditingItem] = useState<Restaurant | User | null>(
        null
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>({
        name: '',
        email: '',
        address: '',
        manager: '',
        restaurant: '',
        phone: '',
        password: '',
    });

    // Use custom hooks for data management
    const {
        restaurants,
        loading: restaurantsLoading,
        error: restaurantsError,
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
        uploadMenu,
    } = useRestaurants();

    const {
        users,
        loading: usersLoading,
        error: usersError,
        createUser,
        updateUser,
        deleteUser,
    } = useUsers();

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const openModal = (
        type: 'restaurant' | 'user',
        item: Restaurant | User | null = null
    ) => {
        setModalType(type);
        setEditingItem(item);
        if (item) {
            setFormData(item);
        } else {
            setFormData({
                name: '',
                email: '',
                address: '',
                manager: '',
                restaurant: '',
                phone: '',
                password: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            name: '',
            email: '',
            address: '',
            manager: '',
            restaurant: '',
            phone: '',
            password: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let success = false;

        if (modalType === 'restaurant') {
            if (editingItem) {
                success = await updateRestaurant(editingItem.id, formData);
            } else {
                success = await createRestaurant(formData);
            }
        } else if (modalType === 'user') {
            if (editingItem) {
                success = await updateUser(editingItem.id, formData);
            } else {
                success = await createUser(formData);
            }
        }

        if (success) {
            closeModal();
        } else {
            // Handle error - you might want to show a toast notification here
            console.error(
                `Failed to ${editingItem ? 'update' : 'create'} ${modalType}`
            );
        }
    };

    const handleDelete = async (type: 'restaurant' | 'user', id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            let success = false;

            if (type === 'restaurant') {
                success = await deleteRestaurant(id);
            } else {
                success = await deleteUser(id);
            }

            if (!success) {
                console.error(`Failed to delete ${type}`);
                // Handle error - show toast notification
            }
        }
    };

    const handleMenuUpload = async (restaurantId: string, file: File) => {
        const success = await uploadMenu(restaurantId, file);
        if (!success) {
            console.error('Failed to upload menu');
            // Handle error - show toast notification
        }
    };

    const renderModal = () =>
        showModal && (
            <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl px-6 py-4">
                        <h3 className="text-lg font-semibold text-white">
                            {editingItem
                                ? `Edit ${
                                      modalType === 'restaurant'
                                          ? 'Restaurant'
                                          : 'User'
                                  }`
                                : `Add New ${
                                      modalType === 'restaurant'
                                          ? 'Restaurant'
                                          : 'User'
                                  }`}
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Enter name"
                                required
                            />
                        </div>

                        {modalType === 'user' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        )}

                        {modalType === 'restaurant' && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Enter restaurant address"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Manager Name
                                    </label>
                                    <input
                                        type="text"
                                        name="manager"
                                        value={formData.manager}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Enter manager name"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {modalType === 'user' && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Restaurant
                                    </label>
                                    <select
                                        name="restaurant"
                                        value={formData.restaurant}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="">
                                            Select Restaurant
                                        </option>
                                        {restaurants.map((restaurant) => (
                                            <option
                                                key={restaurant.id}
                                                value={restaurant.name}
                                                className="text-black"
                                            >
                                                {restaurant.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {!editingItem && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="Enter password"
                                            required
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex justify-end space-x-3 pt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={restaurantsLoading || usersLoading}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
                            >
                                {restaurantsLoading || usersLoading ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {editingItem
                                            ? 'Updating...'
                                            : 'Creating...'}
                                    </div>
                                ) : editingItem ? (
                                    'Update'
                                ) : (
                                    'Create'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );

    const renderDashboard = () => (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-2xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">
                                Welcome back, {currentUser?.name}!
                            </h2>
                            <p className="text-indigo-100 text-lg">
                                Manage your digital menu empire with ALNA
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <Activity className="h-12 w-12 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3">
                                <Store className="h-8 w-8 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                    Total Restaurants
                                </p>
                                <div className="flex items-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {restaurants.length}
                                    </p>
                                    <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-3">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                    Active Managers
                                </p>
                                <div className="flex items-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {
                                            users.filter(
                                                (m) => m.role === 'MANAGER'
                                            ).length
                                        }
                                    </p>
                                    <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-3">
                                <Menu className="h-8 w-8 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                    Menus Uploaded
                                </p>
                                <div className="flex items-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {/* {
                                            restaurants.filter(
                                                (r) => r.menu_uploaded
                                            ).length
                                        } */}
                                        0
                                    </p>
                                    <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3">
                                <QrCode className="h-8 w-8 text-white" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                    QR Codes Generated
                                </p>
                                <div className="flex items-center">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {restaurants.length}
                                    </p>
                                    <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
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
                                    Menu uploaded for &quot;UGOT
                                    Bruncherie&quot;
                                </p>
                                <p className="text-sm text-gray-500">
                                    PDF menu processed and ready for customer
                                    access
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
                                    Customers can now scan QR to access digital
                                    menu
                                </p>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                2 days ago
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRestaurants = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Restaurants
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Manage your restaurant locations and settings
                    </p>
                </div>
                {currentUser?.role === 'ADMIN' && (
                    <button
                        onClick={() => openModal('restaurant')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="font-medium">Add Restaurant</span>
                    </button>
                )}
            </div>

            {/* Error Handling */}
            {restaurantsError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm">{restaurantsError}</p>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Restaurant
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Manager
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Menu
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                QR Code
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {restaurantsLoading ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-8 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                        Loading restaurants...
                                    </div>
                                </td>
                            </tr>
                        ) : restaurants.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-8 text-center text-gray-500"
                                >
                                    No restaurants found. Add your first
                                    restaurant to get started.
                                </td>
                            </tr>
                        ) : (
                            restaurants.map((restaurant, index) => (
                                <tr
                                    key={restaurant.id}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        index % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-gray-50/50'
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2 mr-3">
                                                <Store className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {restaurant.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {restaurant.address}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {/* {restaurant.manager} */}
                                            Restaurant Manager Add Here
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                restaurant
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}
                                        >
                                            <div
                                                className={`h-1.5 w-1.5 rounded-full mr-2 ${
                                                    restaurant
                                                        ? 'bg-green-500'
                                                        : 'bg-red-500'
                                                }`}
                                            ></div>
                                            {/* {restaurant.status} */}
                                            Restaurant Status Add Here
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    // restaurant.menu_uploaded
                                                    true
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                }`}
                                            >
                                                <div
                                                    className={`h-1.5 w-1.5 rounded-full mr-2 ${
                                                        // restaurant.menu_uploaded
                                                        true
                                                            ? 'bg-green-500'
                                                            : 'bg-yellow-500'
                                                    }`}
                                                ></div>
                                                {
                                                    // restaurant.menu_uploaded
                                                    true
                                                        ? 'Uploaded'
                                                        : 'Pending'
                                                }
                                            </span>
                                            {
                                                // !restaurant.menu_uploaded &&
                                                true && (
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file =
                                                                    e.target
                                                                        .files?.[0];
                                                                if (file) {
                                                                    handleMenuUpload(
                                                                        restaurant.id,
                                                                        file
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <Upload className="h-4 w-4 text-indigo-600 hover:text-indigo-800" />
                                                    </label>
                                                )
                                            }
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <QrCode className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                {/* {restaurant.qr_code} */}
                                                #22f4dc
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 hover:bg-indigo-50 rounded">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {currentUser?.role === 'ADMIN' && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            openModal(
                                                                'restaurant',
                                                                restaurant
                                                            )
                                                        }
                                                        className="text-amber-600 hover:text-amber-900 transition-colors p-1 hover:bg-amber-50 rounded"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                'restaurant',
                                                                restaurant.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderManagers = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Restaurant Managers
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Manage user accounts and permissions
                    </p>
                </div>
                {currentUser?.role === 'ADMIN' && (
                    <button
                        onClick={() => openModal('user')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="font-medium">Add Manager</span>
                    </button>
                )}
            </div>

            {/* Error Handling */}
            {usersError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm">{usersError}</p>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Manager
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Restaurant
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {usersLoading ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-8 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                        Loading managers...
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-8 text-center text-gray-500"
                                >
                                    No managers found. Add your first manager to
                                    get started.
                                </td>
                            </tr>
                        ) : (
                            users.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        index % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-gray-50/50'
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-2 mr-3">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {/* {user.restaurant} */}
                                            User Belong to Restaurant Name Add
                                            Here
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                user.isActive
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}
                                        >
                                            <div
                                                className={`h-1.5 w-1.5 rounded-full mr-2 ${
                                                    user.isActive
                                                        ? 'bg-green-500'
                                                        : 'bg-red-500'
                                                }`}
                                            ></div>
                                            {user.isActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            {currentUser?.role === 'ADMIN' && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            openModal(
                                                                'user',
                                                                user
                                                            )
                                                        }
                                                        className="text-amber-600 hover:text-amber-900 transition-colors p-1 hover:bg-amber-50 rounded"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                'user',
                                                                user.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <AdminNavbar currentUser={currentUser} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex space-x-8">
                    {/* Sidebar */}
                    <AdminSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        currentUser={currentUser}
                    />

                    {/* Main Content */}
                    <div className="flex-1">
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'restaurants' && renderRestaurants()}
                        {activeTab === 'managers' && renderManagers()}
                        {activeTab === 'menus' && (
                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                <div className="text-center">
                                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 inline-block mb-4">
                                        <Upload className="h-12 w-12 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        Menu Management
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Upload and manage your restaurant menus
                                        with ease
                                    </p>
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                                        <p className="text-indigo-800 font-medium">
                                            Coming in Phase 2
                                        </p>
                                        <p className="text-sm text-indigo-600 mt-1">
                                            PDF upload, menu parsing, and
                                            customization features
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'qr-codes' && (
                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                <div className="text-center">
                                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 inline-block mb-4">
                                        <QrCode className="h-12 w-12 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        QR Code Management
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Generate and manage QR codes for your
                                        restaurants
                                    </p>
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                                        <p className="text-indigo-800 font-medium">
                                            Coming in Phase 3
                                        </p>
                                        <p className="text-sm text-indigo-600 mt-1">
                                            QR code generation, customization,
                                            and analytics
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {renderModal()}
        </div>
    );
};

export default AdminDashboard;
