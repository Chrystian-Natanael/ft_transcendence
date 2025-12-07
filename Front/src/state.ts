interface User {
    username: string;
    gang: 'batatas' | 'tomates';
}

interface Match {
    p1: string;
    p2: string;
    scoreP1: number;
    scoreP2: number;
}

interface AppStateType {
    currentUser: User | null;
    matchHistory: Match[];
}

const AppState: AppStateType = {
    currentUser: null,
    matchHistory: []
};

export default AppState;
export type { User, Match, AppStateType };
