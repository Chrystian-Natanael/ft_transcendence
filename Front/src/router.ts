type ViewId = 'login-view' | 'dashboard-view' | 'game-view';

const routes: Record<string, ViewId> = {
    '/': 'login-view',
    '/login': 'login-view',
    '/dashboard': 'dashboard-view',
    '/game': 'game-view'
};

const views: Record<ViewId, HTMLElement | null> = {
    'login-view': document.getElementById('login-view'),
    'dashboard-view': document.getElementById('dashboard-view'),
    'game-view': document.getElementById('game-view')
};

function showView(viewId: ViewId): void {
    for (const id in views) {
        const view = views[id as ViewId];
        if (view) {
            view.classList.add('hidden');
        }
    }

    const view = views[viewId];
    if (view) {
        view.classList.remove('hidden');
    } else {
        const loginView = views['login-view'];
        if (loginView) {
            loginView.classList.remove('hidden');
        }
    }
}

export function navigateTo(path: string): void {
    window.history.pushState(null, '', path);
    handleRoute();
}

function handleRoute(): void {
    const path = window.location.pathname;
    const viewId = routes[path] || 'login-view';
    showView(viewId);

    const event = new CustomEvent('routeChange', { detail: { viewId } });
    document.dispatchEvent(event);
}

window.addEventListener('popstate', handleRoute);

document.addEventListener('DOMContentLoaded', () => {
    handleRoute();
});
