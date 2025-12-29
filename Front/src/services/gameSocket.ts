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
    id: number;
    senderId: number;
    senderNick: string;
    senderAvatar: string;
    expiresAt?: string;
}

export interface QueueResponse {
    message: string;
    ticketId?: string;
}

let isTransitioning = false;

export function setTransitioning(value: boolean) {
    isTransitioning = value;
}

// --- FUNÇÃO AUXILIAR PARA INICIAR O JOGO ---
// (Evita repetir código e garante que o jogo inicie mesmo reutilizando socket)
function setupController(retryCount = 0) {
    if (!socket) return;

    // Se já tiver controller, destroi antes
    if (controller) {
        controller.destroy();
        controller = null;
    }

    

    const canvasElement = document.getElementById('pongCanvas');
    if (!canvasElement){
        if(window.location.hash !== '#game') return;}
    
    console.log(canvasElement)

    // CENÁRIO 1: Canvas encontrado! Inicia o jogo.
    if (canvasElement) {
        try {
            console.log("Canvas encontrado! Criando GameController...");
            controller = new GameController(socket);
        } catch (e) {
            console.error("Falha ao iniciar GameController:", e);
        }
    } 
    // CENÁRIO 2: Canvas não existe ainda (HTML carregando). Tenta de novo.
    else {
        if (retryCount < 10) { // Tenta por até 2 segundos (10 * 200ms)
            console.log(`Canvas não encontrado (Tentativa ${retryCount + 1}/10). Aguardando renderização...`);
            setTimeout(() => setupController(retryCount + 1), 200);
        } else {
            console.error("ERRO CRÍTICO: O Canvas do jogo nunca apareceu na tela.");
        }
    }
}

export function initGameSocket() {
    // Se o objeto socket já existe, vamos reutilizá-lo a todo custo
    if (socket) {
        console.log("Socket detectado. Reutilizando instância.");
        
        // Se por acaso caiu, tenta reconectar manualmente em vez de criar um novo
        if (!socket.connected) {
             console.log("Socket estava desconectado. Reconectando...");
             socket.connect();
        }
        
        setupController(); // Inicia o jogo visualmente
        return;
    }

    // Só desconecta se for explicitamente necessário (limpeza manual)
    // Removemos o 'if (socket) disconnectGame()' daqui para evitar loops

    console.log("Iniciando nova conexão de jogo...");
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Tentativa de conectar ao jogo sem token!");
        return;
    }

    socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log("Conectado ao servidor do jogo! Socket ID:", socket?.id);
        setupController();
    });

    socket.on('connect_error', (err) => {
        console.error("Erro de conexão com o jogo:", err);
    });

}

export function disconnectGame() {
    if (isTransitioning) {
        console.log("Transição de tela detectada. Mantendo socket vivo.");
        isTransitioning = false;
        
        if (controller) {
            controller.destroy();
            controller = null;
        }
        return;
    }

    if (controller) {
        console.log("Destruindo GameController...");
        controller.destroy();
        controller = null;
    }

    if (socket) {
        console.log("Desconectando Socket...");
        if (socket.connected) {
            socket.disconnect();
        }
        socket = null;
    }
}

export const multiplayerService = {
    // Busca convites
    listGameInvites: () => 
        api.get<GameInvite[]>('/game/invites'),

    joinRankedQueue: () => 
        api.get<QueueResponse>('/game/ranked'), 

    // Sai da fila
    leaveQueue: () => 
        api.post('/game/queue/leave', {}),

    // Envia convite
    sendGameInvite: (nick: string) => 
        api.post('/game/casual/invite', { nick }),

    // Responde convite
    respondGameInvite: (nick: string, action: 'accept' | 'decline') => 
        api.post(`/game/casual/response`, { nick, action })
};

export function getSocket(): Socket | null {
    return socket;
}