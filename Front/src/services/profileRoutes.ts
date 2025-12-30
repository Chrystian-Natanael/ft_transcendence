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

export const profileService = {
	updateProfile: (data: UpdateNickPayload): Promise<UpdateNickResponse> =>
		api.patch<UpdateNickResponse>("/users/me", data),
		// api.request<UpdateNickResponse>("/users/me", {
		// 	method: "PATCH",
		// 	body: data
		// }),
	
	updateAvatar: (data: UpdateAvatarPayload): Promise<UpdateAvatarResponse> =>
		api.patch<UpdateAvatarResponse>("/users/me/avatar", data),
	
	getProfile: () => api.get("/users/me"),
};
