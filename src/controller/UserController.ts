import { UserModel } from '@/models/UserModel';
import { User } from '@/types/api';

export class UserController {
    private static instance: UserController;
    private users: User[] = [];
    private loading = false;
    private error: string | null = null;

    static getInstance(): UserController {
        if (!UserController.instance) {
            UserController.instance = new UserController();
        }
        return UserController.instance;
    }

    // State getters
    getUsers(): User[] {
        return this.users;
    }

    isLoading(): boolean {
        return this.loading;
    }

    getError(): string | null {
        return this.error;
    }

    // CRUD operations
    async loadUsers(): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await UserModel.getAll();

        if (result.success && result.data) {
            this.users = result.data.users;
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to load users';
            this.loading = false;
            return false;
        }
    }

    async createUser(data: Partial<User>): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await UserModel.create(data);

        if (result.success && result.data) {
            this.users.push(result.data);
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to create user';
            this.loading = false;
            return false;
        }
    }

    async updateUser(id: string, data: Partial<User>): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await UserModel.update(id, data);

        if (result.success && result.data) {
            const index = this.users.findIndex((u) => u.id === id);
            if (index !== -1) {
                this.users[index] = result.data;
            }
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to update user';
            this.loading = false;
            return false;
        }
    }

    async deleteUser(id: string): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await UserModel.delete(id);

        if (result.success) {
            this.users = this.users.filter((u) => u.id !== id);
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to delete user';
            this.loading = false;
            return false;
        }
    }
}
