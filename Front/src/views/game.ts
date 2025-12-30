// Front/src/views/game.ts
import { Button } from "@/components/Button";
import { showModal } from '@/utils/modalManager';
import confetti from 'canvas-confetti';
import { Socket } from 'socket.io-client';
import { LocalGameEngine } from "../game/LocalGameEngine";
import type { GameState } from '../types/game';
import { PowerUpType } from '../types/game';

import imgBlueBall from '../assets/blueball.png';
import imgRedBall from '../assets/redball.png';

// PowerUp icons
import PowerUpBigger from '../assets/PowerUp_Bigger.png';
import PowerUpPepper from '../assets/PowerUp_Pepper.png';
import PowerUpShield from '../assets/PowerUpShield.png';

import imgAIDown from '../assets/moves/AI_Down.png';
import imgAIUp from '../assets/moves/AI_Up.png';
import imgPotatoDown from '../assets/moves/Potato_Down.png';
import imgPotatoUp from '../assets/moves/Potato_Up.png';
import imgTomatoDown from '../assets/moves/Tomato_Down.png';
import imgTomatoUp from '../assets/moves/Tomato_Up.png';


import { getDefaultAvatar } from "@/components/AvatarOptions";
import { navigateTo } from "@/main";
import { state } from "@/store/appState";
import { default as bgMixed, default as bgPotatoes } from '../assets/gameBackground.png';
import bgTomatoes from '../assets/gameBackground.png';


// --- 1. A ESTRUTURA HTML (Visual) ---
export function getGameHtml() {
    const user = state.user;
    const selectedGang = (user?.gang || 'potatoes') as 'potatoes' | 'tomatoes';
    const avatarSrcP1 = user?.avatar || getDefaultAvatar(selectedGang);

    return `
        <div id="game-root" class="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-slate-900">
            
            <div id="stadium-bg" class="absolute inset-0 bg-cover bg-center opacity-40 z-0 transition-all duration-1000"></div>

            <div class="relative z-10 w-full max-w-6xl flex justify-between items-end mb-6 px-8">
                
                <div class="flex flex-col items-center gap-2">
                    <div class="relative group">
                        <img id="p1-photo" src="${avatarSrcP1}" class="w-20 h-20 rounded-full border-4 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] bg-slate-800 object-cover">
                        <div id="p1-shield-badge" class="hidden absolute -top-2 -right-2 bg-cyan-400 text-xs font-bold px-2 py-1 rounded-full animate-bounce">SHIELD</div>
                    </div>
                    <span id="p1-nick" class="text-red-400 font-bold font-mono text-lg shadow-black drop-shadow-md">Player 1</span>
                </div>

                <div class="flex flex-col items-center">
                    <h1 class="text-3xl text-yellow-500 font-bold drop-shadow-[0_2px_0px_rgba(0,0,0,1)] uppercase tracking-widest mb-2">Potato Pong War</h1>
                    <div class="bg-slate-950/80 border-2 border-orange-500/50 px-10 py-4 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-6">
                        <span id="p1-score" class="text-5xl font-mono font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">0</span>
                        <img src="${imgRedBall}" class="w-8 h-8 opacity-80" alt="VS"> 
                        <span id="p2-score" class="text-5xl font-mono font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">0</span>
                    </div>
                </div>

                <div class="flex flex-col items-center gap-2">
                    <div class="relative group">
                        <img id="p2-photo" src="" class="w-20 h-20 rounded-full border-4 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] bg-slate-800 object-cover">
                        <div id="p2-shield-badge" class="hidden absolute -top-2 -left-2 bg-cyan-400 text-xs font-bold px-2 py-1 rounded-full animate-bounce">SHIELD</div>
                    </div>
                    <span id="p2-nick" class="text-amber-400 font-bold font-mono text-lg shadow-black drop-shadow-md">Player 2</span>
                </div>
            </div>

            <div class="relative z-10">
                <div class="relative bg-slate-950 rounded-xl border-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-visible">
                    
                    <div id="p1-game-avatar" class="absolute left-[-180px] w180px] h-[200px] transition-all duration-75 pointer-events-none z-20">
                         <img id="p1-skin-img" src="${avatarSrcP1}" class="w-full h-full drop-shadow-lg filter brightness-110">
                    </div>

                    <canvas id="pongCanvas" width="800" height="600" class="block rounded-lg cursor-none bg-slate-900/50"></canvas>

                    <div id="p2-game-avatar" class="absolute right-[-230px] w-[280px] h-[280px] transition-all duration-75 pointer-events-none z-20">
                        <img id="p2-skin-img" src="${avatarSrcP1}" class="w-full h-full drop-shadow-lg filter brightness-110 transform scale-x-[-1]">
                    </div>

                    <div id="game-overlay" class="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 rounded-lg">
                        <h2 id="overlay-title" class="text-3xl font-bold text-white mb-4 animate-pulse">Aguardando Oponente...</h2>
                        <p id="overlay-msg" class="text-gray-400 mb-6 text-sm">Convide um amigo ou aguarde na fila.</p>
                    </div>
                </div>
            </div>

            <div class="w-full max-w-4xl mt-8 flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-white/10 backdrop-blur-sm shadow-lg z-10">
                <div class="flex gap-12 text-sm font-mono text-gray-400">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold border-b-2 border-slate-500">W</div>
                        <div class="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold border-b-2 border-slate-500">S</div>
                        <span class="text-red-400 font-bold ml-2">Movimento P1</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold border-b-2 border-slate-500">⬆</div>
                        <div class="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold border-b-2 border-slate-500">⬇</div>
                        <span class="text-amber-400 font-bold ml-2">Movimento P2</span>
                    </div>
                </div>

                <div class="w-auto">
                    ${Button({
                        id: "btn-game-quit",
                        text: "Abandonar Partida",
                        variant: "danger",
                        className: "py-2 px-6 text-sm hover:bg-red-900/80 transition-colors"
                    })}
                </div>
            </div>
        </div>
    `;
}

// --- 2. A LÓGICA DO JOGO (Controller) ---
export class GameController {
    private socket: Socket | null = null;
    private localEngine: LocalGameEngine | null = null;
    
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationFrameId: number | null = null;
    
    private els: Record<string, HTMLElement | HTMLImageElement> = {};
    private images: Record<string, HTMLImageElement> = {};
    private gameState: GameState | null = null;
    
    // Rastreamento de movimento dos jogadores
    private p1LastDirection: string = 'DOWN';
    private p2LastDirection: string = 'DOWN';
    private lastP2Y: number = 250;
    
    constructor(source: Socket | { difficulty: number }) {
        this.canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
        if (!this.canvas) throw new Error("Canvas não encontrado no DOM");
        
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        
        this.cacheElements();
        this.loadAssets();

        if ('difficulty' in source) {
            console.log("Iniciando Modo Solo (Local)");
            this.localEngine = new LocalGameEngine(source.difficulty);
            this.setupLocalListeners();
            this.localEngine.start();
        } else {
            console.log("Iniciando Modo Multiplayer (Socket)");
            this.socket = source;
            this.setupSocketListeners();
            const roomId = localStorage.getItem('currentRoomId');
                
            if (!roomId) {
                console.error("Erro: Nenhum RoomID encontrado. Voltando...");
                navigateTo('multiplayer'); 
                return;
            }
            console.log(`Entrando na sala de jogo: ${roomId}`);
            this.socket.emit('joinGame', { roomId });
        }

        this.renderLoop();

        document.getElementById('btn-game-quit')?.addEventListener('click', () => {
            // confirmação com o modal
            showModal({
                title: "Abandonar Partida",
                type: "danger",
                message: "Tem certeza que deseja abandonar a batalha? <br>Se for partida ranqueada, você perderá pontos!",
                onConfirm: () => navigateTo('dashboard'),
                confirmText: "Sim, Abandonar",
                cancelText: "Cancelar"
            })
        });
    }

    private cacheElements() {
        const ids = [
            'p1-score', 'p2-score', 'p1-nick', 'p2-nick', 
            'p1-photo', 'p2-photo', 'p1-game-avatar', 'p2-game-avatar',
            'p1-skin-img', 'p2-skin-img', 'p1-shield-badge', 'p2-shield-badge',
            'stadium-bg', 'game-overlay', 'overlay-title', 'overlay-msg'
        ];
        
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) this.els[id] = el;
        });
    }

    private loadAssets() {
        const assets = {
            // Tomato
            'tomato_up': imgTomatoUp,
            'tomato_down': imgTomatoDown,
            // Potato
            'potato_up': imgPotatoUp,
            'potato_down': imgPotatoDown,
            // AI
            'ai_up': imgAIUp,
            'ai_down': imgAIDown,
            
            // Backgrounds
            'bg_tomatoes': bgTomatoes,
            'bg_potatoes': bgPotatoes,
            'bg_mixed': bgMixed,
            
            // PowerUp icons
            'icon_big': PowerUpBigger,
            'icon_shield': PowerUpShield,
            'icon_speed': PowerUpPepper,
        };

        Object.entries(assets).forEach(([key, src]) => {
            if (!src) {
                console.warn(`Asset ${key} não encontrado`);
                return;
            }
            const img = new Image();
            img.src = src;
            this.images[key] = img;
        });
    }

    private getSkinImage(skin: string, direction: string): string {
        const directionKey = direction === 'UP' ? 'up' : 'down';
        const skinKey = `${skin}_${directionKey}`;
        
        const image = this.images[skinKey];
        return image ? image.src : (skin === 'tomato' ? imgRedBall : imgBlueBall);
    }

    private toggleOverlay(show: boolean) {
        const overlay = this.els['game-overlay'];
        if (overlay) {
            if (show) overlay.classList.remove('hidden');
            else overlay.classList.add('hidden');
        }
    }

    private showOverlay(titleText: string, msgText: string) {
        this.toggleOverlay(true);
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-msg');
        
        if (title) title.innerText = titleText;
        if (msg) msg.innerText = msgText;
    }

    private onGameState = (state: GameState) => {
        this.gameState = state;
        this.updateUI(state);
    };

    private onMatchStatus = (status: string) => {
        if (status === 'waiting') {
            this.showOverlay("Aguardando Oponente...", "Convide um amigo ou aguarde na fila.");
        } 
        else if (status.startsWith('starting:')) {
            const count = status.split(':')[1];
            this.showOverlay("Prepare-se!", `A partida começa em ${count}...`);
        }
        else if (status === 'playing') {
            this.toggleOverlay(false);
        }
    };

    private onScoreUpdate = (data: { scorer: 'player1' | 'player2' }) => {
        this.triggerConfetti(data.scorer);
    };

    private onGameOver = (data: { winnerId: string, message: string }) => {
        this.showGameOver(data);
    };

    private setupSocketListeners() {
        if (!this.socket) return;
        this.socket.on('gameState', this.onGameState);
        this.socket.on('matchStatus', this.onMatchStatus);
        this.socket.on('scoreUpdate', this.onScoreUpdate);
        this.socket.on('gameOver', this.onGameOver);
        
        window.addEventListener('keydown', this.handleInputSocket);
        window.addEventListener('keyup', this.handleInputUpSocket);
    }

    private setupLocalListeners() {
        if (!this.localEngine) return;
        this.localEngine.on('gameState', (_, data) => this.onGameState(data));
        this.localEngine.on('matchStatus', (_, data) => this.onMatchStatus(data));
        this.localEngine.on('scoreUpdate', (_, data) => this.onScoreUpdate(data));
        this.localEngine.on('gameOver', (_, data) => this.onGameOver(data));

        window.addEventListener('keydown', this.handleInputLocal);
        window.addEventListener('keyup', this.handleInputUpLocal);
    }

    private handleInputSocket = (e: KeyboardEvent) => {
        if (e.repeat) return;
        let direction = '';
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' ) direction = 'UP';
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' ) direction = 'DOWN';
        if (direction && this.socket) this.socket.emit('movePaddle', { direction });
    };

    private handleInputUpSocket = (e: KeyboardEvent) => {
        if (['ArrowUp', 'w', 'ArrowDown', 's', 'W', 'S'].includes(e.key) && this.socket) {
             this.socket.emit('movePaddle', { direction: 'STOP' });
        }
    };

    private handleInputLocal = (e: KeyboardEvent) => {
        if (e.repeat) return;
        let direction: 'UP' | 'DOWN' | '' = '';
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') direction = 'UP';
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') direction = 'DOWN';
        if (direction && this.localEngine) {
            this.p1LastDirection = direction;
            this.localEngine.movePaddle(direction);
        }
    };

    private handleInputUpLocal = (e: KeyboardEvent) => {
        if (['ArrowUp', 'w', 'ArrowDown', 's', 'W', 'S'].includes(e.key) && this.localEngine) {
             this.localEngine.movePaddle('STOP');
        }
    };

    private updateUI(state: GameState) {
        // --- 1. Atualizar Textos e Nicks ---
        if (this.els['p1-score']) this.els['p1-score'].innerText = state.player1.score.toString();
        if (this.els['p2-score']) this.els['p2-score'].innerText = state.player2.score.toString();
        if (this.els['p1-nick']) this.els['p1-nick'].innerText = state.player1.nick;
        if (this.els['p2-nick']) this.els['p2-nick'].innerText = state.player2.nick;

        // Detectar direção do P2 automaticamente comparando posição anterior
        if (state.player2.y < this.lastP2Y) {
            this.p2LastDirection = 'UP';
        } else if (state.player2.y > this.lastP2Y) {
            this.p2LastDirection = 'DOWN';
        }
        this.lastP2Y = state.player2.y;

        if (this.els['p1-photo']) {
            const el = this.els['p1-photo'] as HTMLImageElement;
            const src = state.player1.avatar || imgRedBall;
            if (el.src !== src) el.src = src;
        }
        
        if (this.els['p2-photo']) {
            const el = this.els['p2-photo'] as HTMLImageElement;
            const src = state.player2.avatar || imgBlueBall;
            if (el.src !== src) el.src = src;
        }

        const bgKey = 'bg_mixed';
        if (this.images[bgKey] && this.els['stadium-bg']) {
             const newBg = `url("${this.images[bgKey].src}")`;
             if (this.els['stadium-bg'].style.backgroundImage !== newBg) {
                 this.els['stadium-bg'].style.backgroundImage = newBg;
             }
        }

        // --- 4. Game Avatars (Ao lado da raquete) ---
        const AVATAR_OFFSET = 100; 
        
        const p1Top = state.player1.y + (state.player1.height / 2) - AVATAR_OFFSET;
        const p2Top = state.player2.y + (state.player2.height / 2) - AVATAR_OFFSET;

        if (this.els['p1-game-avatar']) this.els['p1-game-avatar'].style.top = `${p1Top}px`;
        if (this.els['p2-game-avatar']) this.els['p2-game-avatar'].style.top = `${p2Top}px`;

        // Imagem P1 (Raquete) - Esquerda
        if (this.els['p1-skin-img']) {
            const el = this.els['p1-skin-img'] as HTMLImageElement;
            const src = this.getSkinImage(state.player1.skin, this.p1LastDirection);
            if (el.src !== src) el.src = src;
            // inverter a imagem para o lado esquerdo
            el.style.transform = 'scaleX(-1)';
        }
        
        // Imagem P2 (Raquete) - Direita
        if (this.els['p2-skin-img']) {
            const el = this.els['p2-skin-img'] as HTMLImageElement;
            const src = this.getSkinImage(state.player2.skin, this.p2LastDirection);
            if (el.src !== src) el.src = src;
            el.style.transform = 'scaleX(-1)';
        }

        // --- 5. Escudos ---
        if (this.els['p1-shield-badge']) this.els['p1-shield-badge'].classList.toggle('hidden', !state.player1.shield);
        if (this.els['p2-shield-badge']) this.els['p2-shield-badge'].classList.toggle('hidden', !state.player2.shield);
    }

    private renderLoop = () => {
        if (!this.gameState) {
            this.animationFrameId = requestAnimationFrame(this.renderLoop);
            return;
        }

        try {
            const { width, height } = this.canvas;
            this.ctx.clearRect(0, 0, width, height);

            // Linha do meio
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([15, 15]);
            this.ctx.beginPath();
            this.ctx.moveTo(width / 2, 0);
            this.ctx.lineTo(width / 2, height);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Raquetes e Bola
            this.drawPaddle(this.gameState.player1, 10);
            this.drawPaddle(this.gameState.player2, width - 20);

            this.ctx.beginPath();
            this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#fff';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // PowerUps
            if (this.gameState.powerUp && this.gameState.powerUp.active) {
                this.drawPowerUp(this.gameState.powerUp);
            }

        } catch (error) {
            console.error("Erro no renderLoop:", error);
        }

        this.animationFrameId = requestAnimationFrame(this.renderLoop);
    };

    private drawPaddle(player: GameState['player1'], x: number) {
        this.ctx.fillStyle = player.skin === 'tomato' ? '#ef4444' : '#fbbf24';
        
        if (player.shield) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'cyan';
            this.ctx.fillStyle = 'cyan'; 
        }

        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, player.y, 10, player.height, 5);
        } else {
            this.ctx.rect(x, player.y, 10, player.height);
        }
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    private drawPowerUp(powerUp: NonNullable<GameState['powerUp']>) {
        const { x, y, type } = powerUp;
        const iconSize = 80;
        const offset = iconSize / 2;

        // Seleciona a imagem correta baseado no tipo de PowerUp
        let icon: HTMLImageElement | undefined;
        let color = '#fff';

        const typeStr = type as unknown as string;

        if (typeStr === 'BIG_PADDLE' || type === PowerUpType.BIG_PADDLE) { 
            icon = this.images['icon_big'];
            color = '#22c55e'; 
        }
        else if (typeStr === 'SHIELD' || type === PowerUpType.SHIELD) { 
            icon = this.images['icon_shield'];
            color = '#06b6d4'; 
        }
        else if (typeStr === 'SPEED_BOOST' || type === PowerUpType.SPEED_BOOST) { 
            icon = this.images['icon_speed'];
            color = '#f97316'; 
        }

        if (icon && icon.complete && icon.naturalWidth > 0) {
            try {
                this.ctx.drawImage(icon, x - offset, y - offset, iconSize, iconSize);
            } catch (e) {
                this.drawPowerUpFallback(x, y, color);
            }
        } else {
            this.drawPowerUpFallback(x, y, color);
        }
    }

    private drawPowerUpFallback(x: number, y: number, color: string) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('?', x, y + 5);
    }

    private triggerConfetti(scorer: 'player1' | 'player2') {
        const isLeft = scorer === 'player1';
        const color = isLeft ? '#ef4444' : '#fbbf24';
        
        confetti({
            particleCount: 100,
            spread: 60,
            origin: { x: isLeft ? 0.2 : 0.8, y: 0.5 },
            colors: [color, '#ffffff']
        });
    }

    private showGameOver(data: { winnerId: string, message: string }) {
        const overlay = this.els['game-overlay'];
        if (overlay) {
            overlay.classList.remove('hidden');
            if (this.els['overlay-msg']) this.els['overlay-msg'].innerText = data.message;
            if (this.els['overlay-title']) this.els['overlay-title'].innerText = "FIM DE JOGO";
        }

        showModal({
            title: "FIM DE JOGO",
            type: "success",
            message: data.message,
            onConfirm: () => navigateTo('dashboard'),
            confirmText: "Voltar ao Dashboard",
        })
    }

    public destroy() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        window.removeEventListener('keydown', this.handleInputSocket);
        window.removeEventListener('keyup', this.handleInputUpSocket);
        window.removeEventListener('keydown', this.handleInputLocal);
        window.removeEventListener('keyup', this.handleInputUpLocal);
        
        if (this.socket) {
            this.socket.off('gameState');
            this.socket.off('scoreUpdate');
            this.socket.off('gameOver');
            this.socket.off('matchStatus');
        }

        if (this.localEngine) {
            this.localEngine.stop();
        }
    }
}