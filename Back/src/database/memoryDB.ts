export class User {
    id: number;
    name: string;
    nick: string;
    email: string;
    password?: string;
    isAnonymous: boolean;
    lastActivity?: number;
    gang: 'potatoes' | 'tomatoes';
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    backupCodes?: string[];
    score?: number;
    friends: number[];
    friendRequestsSent: number[];
    friendRequestsReceived: number[];
    isOnline?: boolean;
    avatar?: string;
    gameAvatar?: string;

    constructor(data: Omit<User, 'id'> & { id: number }) {
        this.id = data.id;
        this.name = data.name;
        this.nick = data.nick;
        this.email = data.email;
        this.password = data.password;
        this.isAnonymous = data.isAnonymous;
        this.lastActivity = data.lastActivity;
        this.gang = data.gang;
        this.twoFactorEnabled = data.twoFactorEnabled;
        this.twoFactorSecret = data.twoFactorSecret;
        this.backupCodes = data.backupCodes;
        this.score = data.score;
        this.friends = data.friends;
        this.friendRequestsSent = data.friendRequestsSent;
        this.friendRequestsReceived = data.friendRequestsReceived;
        this.isOnline = data.isOnline;
        this.avatar = data.avatar;
        this.gameAvatar = data.gameAvatar;
    }

    // Métodos setters
    setName(name: string): void {
        this.name = name;
    }

    setNick(nick: string): void {
        this.nick = nick;
    }

    setEmail(email: string): void {
        this.email = email;
    }

    setPassword(password: string): void {
        this.password = password;
    }

    setScore(score: number): void {
        this.score = score;
    }

    setGang(gang: 'potatoes' | 'tomatoes'): void {
        this.gang = gang;
    }

    setOnline(isOnline: boolean): void {
        this.isOnline = isOnline;
    }

    addFriend(friendId: number): void {
        if (!this.friends.includes(friendId)) {
            this.friends.push(friendId);
        }
    }

    removeFriend(friendId: number): void {
        this.friends = this.friends.filter(id => id !== friendId);
    }

    setAvatar(avatar: string): void {
        this.avatar = avatar;
    }
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
            isAnonymous: false, gang: 'potatoes', score: 4500,
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
        const newUser = new User({ ...data, id: this.nextId++ });
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
