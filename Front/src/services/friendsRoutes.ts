import { api } from "./api";

interface FriendRequestPayload {
	nick: string;
}

interface FriendResponsePayload {
	nick: string;
	action: 'accept' | 'decline';
}

interface UserResponse {
	id: number;
	name: string;
	nick: string;
	email?: string;
	isAnonymous: boolean;
	gang: 'potatoes' | 'tomatoes';
}

interface FriendsListResponse {
	id: number;
	name: string;
	nick: string;
	email?: string;
	isAnonymous: boolean;
	gang: 'potatoes' | 'tomatoes';
}

interface FriendRequestResponse {
	message: string;
}

interface FriendResponseResponse {
	message: string;
}

interface RemoveFriendResponse {
	message: string;
}

export const friendsService = {
	listFriends: (): Promise<FriendsListResponse[]> =>
		api.get<FriendsListResponse[]>("/friends/list"),

	getUserById: (id: string | number): Promise<UserResponse> =>
		api.get<UserResponse>(`/friends/users/${id}`),

	sendFriendRequest: (data: FriendRequestPayload): Promise<FriendRequestResponse> =>
		api.post<FriendRequestResponse>("/friends/request", data),

	respondFriendRequest: (data: FriendResponsePayload): Promise<FriendResponseResponse> =>
		api.post<FriendResponseResponse>("/friends/response", data),

	removeFriend: (id: string | number): Promise<RemoveFriendResponse> =>
		api.delete<RemoveFriendResponse>(`/friends/remove/${id}`),
};
