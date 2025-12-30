import { io, Socket } from 'socket.io-client';
import { GameController } from '../views/game';
import { api } from './api';

const BASE_URL = import.meta.env.VITE_API_URL

if (!BASE_URL) {
    throw new Error("VITE_API_URL is not defined in environment variables");
}

let socket: Socket | null = null;
let controller: GameController | null = null;

export interface GameInvite {
    senderNick: string;
    senderAvatar: string;
}

export interface QueueResponse {
    message: string;
    ticketId?: string;
}

let isTransitioning = false;

export function setTransitioning(value: boolean) {
    isTransitioning = value;
}

function setupController(retryCount = 0) {
    if (!socket) return;

    if (controller) {
        controller.destroy();
        controller = null;
    }

    const canvasElement = document.getElementById('pongCanvas');
    if (!canvasElement){
        if(window.location.hash !== '#game') return;
    }

    if (canvasElement) {
        try {
            console.log("Canvas encontrado! Criando GameController...");
            controller = new GameController(socket);
        } catch (e) {
            console.error("Falha ao iniciar GameController:", e);
        }
    }
    else {
        if (retryCount < 10) {
            setTimeout(() => setupController(retryCount + 1), 200);
        }
    }
}

export function initGameSocket() {
    if (socket) {
        if (!socket.connected) {
             socket.connect();
        }
        setupController();
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log("Conectado ao Jogo:", socket?.id);
        setupController();
    });
}

export function disconnectGame() {
    if (isTransitioning) {
        isTransitioning = false;
        if (controller) {
            controller.destroy();
            controller = null;
        }
        return;
    }
    if (controller) {
        controller.destroy();
        controller = null;
    }
    if (socket) {
        if (socket.connected) socket.disconnect();
        socket = null;
    }
}

export const multiplayerService = {
    joinRankedQueue: () =>
        api.get<QueueResponse>('/game/ranked'),

    leaveQueue: () =>
        api.post('/game/queue/leave', {}),

    sendGameInvite: (nick: string) =>
        api.post('/game/casual/invite', { nick }),

    respondGameInvite: (nick: string, action: 'accept' | 'decline') =>
        api.post(`/game/casual/response`, { nick, action })
};

export function getSocket(): Socket | null {
    return socket;
}
