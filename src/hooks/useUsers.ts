'use client';

import { UserController } from '@/controller/UserController';
import { User } from '@/types/api';
import { useEffect, useState } from 'react';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const controller = UserController.getInstance();

    const loadUsers = async () => {
        setLoading(true);
        const success = await controller.loadUsers();
        setUsers(controller.getUsers());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    const createUser = async (data: Partial<User>) => {
        setLoading(true);
        const success = await controller.createUser(data);
        setUsers(controller.getUsers());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    const updateUser = async (id: string, data: Partial<User>) => {
        setLoading(true);
        const success = await controller.updateUser(id, data);
        setUsers(controller.getUsers());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    const deleteUser = async (id: string) => {
        setLoading(true);
        const success = await controller.deleteUser(id);
        setUsers(controller.getUsers());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        users,
        loading,
        error,
        loadUsers,
        createUser,
        updateUser,
        deleteUser,
    };
}
