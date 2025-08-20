import { clientApiService } from '@/service/clientApiService';
import { ApiResponse, Pagination, User } from '@/types/api';

type UserListResponse = {
    users: User[];
    pagination: Pagination;
};

type UserManagersResponse = {
    managers: User[];
    pagination: Pagination;
};

export class UserModel {
    static async getAll(): Promise<ApiResponse<UserListResponse>> {
        return clientApiService.get<UserListResponse>('/users');
    }

    static async getManagers(): Promise<ApiResponse<UserManagersResponse>> {
        return clientApiService.get<UserManagersResponse>(
            '/users?role=MANAGER'
        );
    }

    static async getById(id: string): Promise<ApiResponse<User>> {
        return clientApiService.getById<User>('/users', id);
    }

    static async create(
        data: Partial<User> & { password?: string }
    ): Promise<ApiResponse<User>> {
        return clientApiService.create<User>('/users', data);
    }

    static async update(
        id: string,
        data: Partial<User>
    ): Promise<ApiResponse<User>> {
        return clientApiService.update<User>('/users', id, data);
    }

    static async delete(id: string): Promise<ApiResponse<void>> {
        return clientApiService.delete('/users', id);
    }

    // Convert regular user to manager
    static async promoteToManager(
        userId: string,
        restaurantId: string
    ): Promise<ApiResponse<User>> {
        return clientApiService.update<User>('/users', userId, {
            role: 'MANAGER',
            restaurantId,
        });
    }

    // Remove manager role (convert back to regular user)
    static async demoteManager(userId: string): Promise<ApiResponse<User>> {
        return clientApiService.update<User>('/users', userId, {
            role: 'USER',
            restaurantId: undefined,
        });
    }
}
