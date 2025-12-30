import { api } from "./api";

interface UpdateNickPayload {
	nick: string;
}

interface UpdateAvatarPayload {
	avatarId: string;
}

interface UpdateNickResponse {
	message: string;
	user: {
		id: number;
		name: string;
		nick: string;
		email: string;
		isAnonymous: boolean;
		gang: 'potatoes' | 'tomatoes';
		has2FA: boolean;
	};
	token: string;
}

interface UpdateAvatarResponse {
	message: string;
	user: {
		id: number;
		name: string;
		nick: string;
		email: string;
		isAnonymous: boolean;
		gang: string;
		has2FA: boolean;
		avatar?: string;
	};
}

interface UserData {
	id: number;
	name: string;
	nick: string;
	email: string;
	isAnonymous: boolean;
	gang: string;
	has2FA: boolean;
	avatar?: string;
	score: number;
	gamesWinned: number;
	gamesLosed: number;
	gamesPlayed: number;
	winRate: number;
}

export const profileService = {
	updateProfile: (data: UpdateNickPayload): Promise<UpdateNickResponse> =>
		api.patch<UpdateNickResponse>("/users/me", data),

	updateAvatar: (data: UpdateAvatarPayload): Promise<UpdateAvatarResponse> =>
		api.patch<UpdateAvatarResponse>("/users/me/avatar", data),

	getProfile: (): Promise<UserData> => api.get("/users/me"),
};
