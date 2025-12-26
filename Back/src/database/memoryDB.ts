export interface User {
    id: number;
    name: string;
    nick: string;
    email: string;
    password?: string;
    isAnonymous: boolean;
    lastActivity?: number;
    gang: 'potatoes' | 'tomatoes'
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    backupCodes?: string[];
    score?: number;
    friends: number[];
    friendRequestsSent: number[];
    friendRequestsReceived: number[];
}

class MemoryDatabase {
    private users: User[] = [];
    private nextId = 1;

    constructor() {
        // CORREÇÃO: Removemos o "as User".
        // O TypeScript agora sabe que este objeto bate com Omit<User, 'id'>
        this.addUser({
            name: 'batata', nick: 'batata', email: 'batata@teste.com',
            password: '$2b$10$zyn5MC8ezQtsVR/4NQD6W.fdIfSDC.997KP72mNbq2EjBt.hEnWKe',
            isAnonymous: false, gang: 'potatoes', score: 5000,
            friends: [], friendRequestsSent: [], friendRequestsReceived: []
        });
        
        this.addUser({
            name: 'tomate', nick: 'tomate', email: 'tomate@teste.com',
            password: '$2b$10$zyn5MC8ezQtsVR/4NQD6W.fdIfSDC.997KP72mNbq2EjBt.hEnWKe',
            isAnonymous: false, gang: 'tomatoes', score: 4500,
            friends: [], friendRequestsSent: [], friendRequestsReceived: []
        });
    }

    public getAllUsers(): User[] {
        return this.users;
    }

    public async findUserById(id: number): Promise<User | undefined> {
        return this.users.find(u => u.id === id);
    }

    public findUserByNick(nick: string): User | undefined {
        return this.users.find(u => u.nick === nick);
    }

    public findUserByEmail(email: string): User | undefined {
        return this.users.find(u => u.email === email);
    }

    public findByIdentifier(identifier: string): User | undefined {
        return this.users.find(u => 
            (u.email === identifier || u.nick === identifier) && !u.isAnonymous
        );
    }

    public addUser(data: Omit<User, 'id'>): User {
        const newUser: User = { ...data, id: this.nextId++ };
        this.users.push(newUser);
        return newUser;
    }

    public deleteUser(id: number): boolean {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.users.splice(index, 1);
            return true;
        }
        return false;
    }
    
    public setUsers(newUsers: User[]) {
        this.users = newUsers;
    }
}

export const db = new MemoryDatabase();