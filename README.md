*This project has been created as part of the 42 curriculum by  cnatanae, danbarbo, leobarbo, tmalheir*

## Description

**ft_transcendence** is a full-stack multiplayer Pong platform featuring real-time gameplay, advanced authentication with 2FA, friend system, ranked matches, power-ups, and leaderboards. 

Key features include:
- Live multiplayer Pong with Socket.IO (60fps game loop, collision physics, power-ups)
- TOTP-based two-factor authentication (QR setup, backup codes)
- Gang-based theming (Potatoes vs Tomatoes UI customization)
- Solo AI mode with 3 difficulty levels (C.A.D.E.T.E bot)
- Friends system with match invitations
- Global ranked leaderboard (+20/-10 point system)
- Complete user profile with stats and avatar customization

## Instructions

### Prerequisites
- **Linux** environment (required for Makefile compatibility)
- **Docker** and **Docker Compose**
- **Make** utility
- **Git**

### Setup & Run
This project is fully containerized for easy deployment. Use the provided `Makefile` to manage the application lifecycle.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/DanielSurf10/ft_transcendence.git](https://github.com/DanielSurf10/ft_transcendence.git)
    cd ft_transcendence
    ```

2.  **Start the application:**
    This command builds the Docker images for both frontend and backend, sets up the internal network, and starts the containers in detached mode.
    ```bash
    make all
    ```
    - The frontend will be available at `http://localhost:5173`
    - The backend API will be available at `http://localhost:3333`

3.  **View logs (optional):**
    To monitor the application logs in real-time:
    ```bash
    make logs
    ```
    Press `Ctrl+C` to exit the log view (this does not stop the application).

4.  **Stop the application:**
    To stop and remove the containers:
    ```bash
    make clean
    ```

5.  **Full Reset:**
    To stop containers, remove volumes (database data), and delete built images for a clean slate:
    ```bash
    make fclean
    ```

6.  **Rebuild and Restart:**
    To perform a full reset and immediately restart the application:
    ```bash
    make re
    ```

### Development Notes
- The `docker-compose.yml` mounts the local directories to the containers, enabling hot-reloading. Changes to the source code will be reflected immediately without rebuilding.
- **Database Persistence**: Data is persisted in a Docker volume mapping to `./Backend/data`. Using `make fclean` will delete this data.

## Resources

**Core Technologies**:
- [Fastify Documentation](https://fastify.dev/)
- [Socket.IO Real-time Docs](https://socket.io/docs/v4/)
- [Prisma ORM](https://prisma.io) (production-ready)
- [TailwindCSS + Vite](https://tailwindcss.com/docs/guides/vite)
- [otplib for 2FA](https://www.npmjs.com/package/otplib)

**AI Usage**: 
AI assisted with README structure, Zod schema patterns, and Pong physics debugging. All core game logic, Socket.IO integration, 2FA flow, frontend routing, and real-time synchronization were manually implemented and rigorously tested.

## Team Information

**cnatanae** 
- **Roles**: Developer & DevOps
- **Responsibilities**: Backend APIs & Game Engine 

**danbarbo**
- **Roles**: Developer & TechLead
- **Responsibilities**: Backend APIs & Project Integrations

**leobarbo** 
- **Roles**: Developer & Project Manager (PM)
- **Responsibilities**: 2FA system, FrontEnd Views

**tmalheir**
- **Roles**: Developer & Project Owner (PO)
- **Responsibilities**: MemoryDB, FrontEnd Views

## Project Management

- **Organization**: 4-member team with clear task distribution across backend, frontend, auth, and features. Daily coordination through structured workflows.
- **Tools**: Trello, VS Code with TypeScript extensions and github
- **Communication**: Discord channels for day-to-day coordination, group voice calls for planning, live coding sessions for complex features and debugging, WhatsApp

## Technical Stack

**Frontend**:
- Vite + TypeScript + TailwindCSS
- Component-based UI library (Button, Card, Input, Form, Modal)
- Custom state management with appState store

**Backend**:
- Fastify (Node.js/TypeScript) + Zod validation
- Socket.IO for real-time multiplayer (60fps game loop)
- JWT authentication + TOTP 2FA (otplib + QRCode)
- Swagger API documentation

**Database**:
- Custom MemoryDB (in-memory SQLite-like for development)
- Prisma ORM integration ready for PostgreSQL production
- Automatic cleanup of inactive anonymous sessions

**Justification**:
Fastify selected for superior performance and plugin ecosystem. Socket.IO ideal for low-latency game synchronization. MemoryDB enables instant testing without Docker complexity during rapid development iteration.

## Database Schema

**Users Table** (MemoryDB structure):
Users {

id: number (PK, auto-increment)

name: string (display name)

nick: string (unique username)

email: string (unique)

password: string (bcrypt hash, null for anonymous)

gang: 'potatoes' | 'tomatoes'

isAnonymous: boolean

twoFactorEnabled: boolean

twoFactorSecret: string (TOTP secret)

backupCodes: string[] (8 backup codes)

score: number (ranked points, default 0)

friends: number[] (user IDs)

friendRequestsSent: number[]

friendRequestsReceived: number[]

lastActivity: Date (auto-updated)
}

**Relationships**: 
- Self-referential friends (many-to-many via ID arrays)
- No separate matches table (handled by active game sessions)

## Features List

| Feature | Developer | Description |
|---------|-----------|-------------|
| **Authentication** | danbarbo | Register/login (email+password), anonymous mode |
| **2FA System** | leobarbo | TOTP QR setup, enable/disable, backup codes |
| **game engine** | cnatanae | Socket.IO Pong (collision physics, 60fps) |
| **Friends System** | danbarbo | Send/accept requests, match invitations |
| **game matches** | cnatanae | +20 win/-10 loss points, global leaderboard |
| **Power-ups** | leobarbo | Big paddle, shield, speed boost (5s duration) |
| **Solo AI** | tmalheir | 3 difficulties vs C.A.D.E.T.E bot |
| **Profile & Stats** | leobarbo | Avatar, match history, stats |
| **views theme** | tmalheir |  gang theming |

## Modules

### Web & Infrastructure
- **Major**: Implement real-time features using WebSockets (Socket.IO for game loop @60fps & live notifications).
- **Major**: Standard user management and authentication (JWT-based auth, anonymous login, session management).
- **Minor**: Use a backend framework (Fastify with TypeScript).
- **Minor**: Use an ORM for the database (Prisma ORM structure).
- **Minor**: Custom-made design system with reusable components (10+ components: Button, Input, Modal, Card, Toast, Avatar, Navbar, etc., using TailwindCSS).
- **Minor**: Support for additional browsers (Compatible with Chrome, Firefox, and Safari).

### Gameplay & Features
- **Major**: Implement a complete web-based game where users can play against each other (Classic Pong physics).
- **Major**: Remote players — Enable two players on separate computers to play the same game in real-time.
- **Major**: Introduce an AI Opponent for games (C.A.D.E.T.E bot with 3 difficulty levels).
- **Minor**: Game customization options (Power-ups: Big Paddle, Shield, Speed Boost).
- **Minor**: A gamification system to reward users for their actions (Ranked ELO system, Leaderboards, Match History).

### Security
- **Minor**: Implement a complete 2FA (Two-Factor Authentication) system for the users (TOTP via Google Authenticator).

### Custom Modules

#### **Major: Single Page Application (SPA) Architecture**
**Justification:**
- **Why you chose this module:** We chose to build the frontend as a Single Page Application to provide a fluid, native-app-like experience. In a real-time game, page reloads are detrimental to the user experience as they sever WebSocket connections.
- **What technical challenges it addresses:**
    - **State Management:** implementing a global store (`appState`) to manage user sessions, notifications, and game states across different views without losing data.
    - **WebSocket Lifecycle:** maintaining a persistent Socket.IO connection while the user navigates through menus, lobbies, and game views, preventing unnecessary reconnection handshakes.
    - **Client-Side Routing:** handling navigation and history API manually to render components dynamically without triggering server-side requests for HTML.
- **How it adds value:** It drastically reduces server load by only fetching data (JSON) rather than markup, ensures the background music and game invitations persist during navigation, and provides instant UI transitions.
- **Why it deserves Major module status:** Implementing a robust SPA requires architecting a complex frontend system from the ground up (routing, state, component lifecycle) rather than just serving static pages. It fundamentally changes how the frontend interacts with the backend APIs.

#### **Minor: Dynamic Gang Theming (Potatoes vs Tomatoes)**
**Justification:**
- **Why you chose this module:** To move away from generic "Dark/Light" modes and give the project a unique identity ("Gang War") that permeates every aspect of the UI.
- **What technical challenges it addresses:**
    - **Dynamic Asset Swapping:** Changing not just CSS colors, but also image assets (avatars, backgrounds, game skins) on the fly based on the user's selected gang.
    - **Context Propagation:** ensuring the theme choice is persisted in the database, loaded upon login, and immediately reflected across all reusable components.
- **How it adds value:** It enhances user immersion and gamifies the UI itself. The visual feedback of "belonging" to a gang (Red/Tomatoes vs Yellow/Potatoes) encourages user interaction and personalization.

**Implementation Details**: Full REST API + WebSocket integration. Custom MemoryDB with session persistence and automatic cleanup.

## Individual Contributions

**danbarbo**:
- **Core Implementation**: backend routes
- **Technical Challenges Overcome**:

- **Owned Features**: Authentication & Friends System

**leobarbo**:
- **Core Implementation**: frontend views
- **Technical Challenges Overcome**:

- **Owned Features**: Profile Assets, PowerUps & 2FA 

**cnatanae**:
- **Core Implementation**: gameEngine
- **Technical Challenges Overcome**: 

- **Owned Features**: GameMatches & engine

**tmalheir**:
- **Core Implementation**: FrontEnd Views
- **Technical Challenges Overcome**:

- **Owned Features**: views theme & SoloAI

View API docs
http://localhost:3333/docs

Ranked match flow
Login → Friends → Invite → Accept → Play → +20/-10 points

### API Endpoints
POST /auth/register # Create account
POST /auth/login # JWT flow
POST /auth/login/2FA # 2FA flow
POST /auth/anonymous # Guest mode
POST /auth/logout # logout aplication
DELETE /auth/delete # delele anonymous
POST /auth/2fa/setup # QR code generation
POST /auth/2fa/enable # enable 2FA
POST /auth/2fa/disable # disable 2FA

GET /leaderboards # Global ranking

GET /friends/list #  list friends
GET /friends/users/:id # find a specific user
POST /friends/request # Invite user to friend list
POST /friends/response # accept or decline a friend invitation
DELETE /friends/remove/:id # remove user from friends list
GET /friends/requests/received # list a pendent invites received 

GET /users/me # get user informations
PATCH /users/me # update nick
PATCH /users/me/avatar # update avatar

GET /game/ranked # Find opponent in ranked mode
POST /game/casual/invite # invite a friend for a game pong
POST /game/casual/response # accept or decline a invite for a game pong
POST /game/queue/leave # leave queue game




### Known Limitations
- MemoryDB resets on server restart (use Prisma/PostgreSQL for production)
- Tournament brackets as future enhancement

### Deployment Notes
Production ready with Prisma:
npm install @prisma/client prisma
npx prisma db push # PostgreSQL
npm run start

**License**: Educational use only (42 School curriculum project)