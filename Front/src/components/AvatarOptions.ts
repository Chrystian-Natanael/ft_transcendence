import potato2 from '/assets/Profile_images/Potato_batata_inglesa.png';
import potato1 from '/assets/Profile_images/Potato_default.jpg';
import potato3 from '/assets/Profile_images/Potato_hot_potato.jpg';
import potato4 from '/assets/Profile_images/Potato_little_potato.png';
import potato5 from '/assets/Profile_images/Potato_mage.png';
import potato6 from '/assets/Profile_images/Potato_miss_potato.png';
import potato7 from '/assets/Profile_images/Potato_sr_potato.png';

import tomato2 from '/assets/Profile_images/Tomato_ballerina.png';
import tomato3 from '/assets/Profile_images/Tomato_bat.jpg';
import tomato1 from '/assets/Profile_images/Tomato_default.jpg';
import tomato4 from '/assets/Profile_images/Tomato_green_tomato.png';
import tomato5 from '/assets/Profile_images/Tomato_sinore_tomato.png';
import tomato6 from '/assets/Profile_images/Tomato_Tomarillo.png';

export interface AvatarOption {
	id: string;
	src: string;
	alt: string;
}

export type Gang = 'potatoes' | 'tomatoes';

export const avatarsByGang: Record<Gang, AvatarOption[]> = {
	potatoes: [
		{ id: 'potato-1', src: potato1, alt: 'Batata 1' },
		{ id: 'potato-2', src: potato2, alt: 'Batata 2' },
		{ id: 'potato-3', src: potato3, alt: 'Batata 3' },
		{ id: 'potato-4', src: potato4, alt: 'Batata 4' },
		{ id: 'potato-5', src: potato5, alt: 'Batata 5' },
		{ id: 'potato-6', src: potato6, alt: 'Batata 6' },
		{ id: 'potato-7', src: potato7, alt: 'Batata 7' },
	],
	tomatoes: [
		{ id: 'tomato-1', src: tomato1, alt: 'Tomate 1' },
		{ id: 'tomato-2', src: tomato2, alt: 'Tomate 2' },
		{ id: 'tomato-3', src: tomato3, alt: 'Tomate 3' },
		{ id: 'tomato-4', src: tomato4, alt: 'Tomate 4' },
		{ id: 'tomato-5', src: tomato5, alt: 'Tomate 5' },
		{ id: 'tomato-6', src: tomato6, alt: 'Tomate 6' },
	],
};

export function getAvatarsForGang(gang: Gang): AvatarOption[] {
	return avatarsByGang[gang] || [];
}

export function getDefaultAvatar(gang: Gang): string {
	const avatars = avatarsByGang[gang];
	return avatars.length > 0 ? avatars[0].src : '';
}

export function getAvatarById(gang: Gang, id: string): AvatarOption | undefined {
	return avatarsByGang[gang].find(avatar => avatar.id === id);
}

const gangStyles = {
	potatoes: {
		borderColor: 'border-yellow-500',
		hoverBorder: 'hover:border-yellow-400',
		glowColor: 'hover:shadow-[0_0_15px_rgba(234,179,8,0.5)]',
		titleColor: 'text-yellow-400',
		selectedRing: 'ring-yellow-500',
		emoji: '🥔',
	},
	tomatoes: {
		borderColor: 'border-red-500',
		hoverBorder: 'hover:border-red-400',
		glowColor: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]',
		titleColor: 'text-red-400',
		selectedRing: 'ring-red-500',
		emoji: '🍅',
	},
};

function renderAvatarItem(avatar: AvatarOption, gang: Gang): string {
	const styles = gangStyles[gang];

	return `
		<button
			type="button"
			class="avatar-option relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden
					border-2 border-white/20 ${styles.hoverBorder} ${styles.glowColor}
					transition-all duration-300 cursor-pointer
					hover:scale-110 focus:outline-none focus:ring-2 ${styles.selectedRing}
					focus:ring-offset-2 focus:ring-offset-slate-900"
			data-avatar-id="${avatar.id}"
			data-avatar-src="${avatar.src}"
		>
			<img
				src="${avatar.src}"
				alt="${avatar.alt}"
				class="w-full h-full object-cover"
			/>
		</button>
	`;
}

export function AvatarSelectionModal(gang: Gang): string {
	const avatars = avatarsByGang[gang];
	const styles = gangStyles[gang];

	const avatarsHtml = avatars
		.map(avatar => renderAvatarItem(avatar, gang))
		.join('');

	return `
		<div id="avatar-modal-backdrop"
			 class="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">

			<div class="bg-slate-900 border-2 ${styles.borderColor} rounded-2xl p-6 md:p-8 max-w-lg w-full
						shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in">

				<!-- Header -->
				<div class="text-center mb-6">
					<h3 class="text-2xl md:text-3xl font-bold ${styles.titleColor} mb-2">
						${styles.emoji} Escolha seu Avatar
					</h3>
					<p class="text-gray-400 text-sm">
						Selecione uma imagem para representar você
					</p>
				</div>

				<!-- Grid de Avatares -->
				<div id="avatar-grid" class="grid grid-cols-3 gap-4 justify-items-center mb-6">
					${avatarsHtml}
				</div>

				<!-- Botão Cancelar -->
				<div class="flex justify-center">
					<button
						id="btn-avatar-cancel"
						type="button"
						class="px-6 py-2 rounded-lg font-bold bg-slate-700 hover:bg-slate-600
							   text-white transition-all duration-200"
					>
						Cancelar
					</button>
				</div>
			</div>
		</div>
	`;
}

export function showAvatarModal(
	gang: Gang,
	onSelect: (avatarId: string, avatarSrc: string) => void
): void {
	const layer = document.getElementById('modal-layer');
	if (!layer) return;

	layer.innerHTML = AvatarSelectionModal(gang);

	document.getElementById('btn-avatar-cancel')?.addEventListener('click', () => {
		closeAvatarModal();
	});

	document.getElementById('avatar-modal-backdrop')?.addEventListener('click', (e) => {
		if (e.target === e.currentTarget) {
			closeAvatarModal();
		}
	});

	const avatarButtons = layer.querySelectorAll('.avatar-option');
	avatarButtons.forEach(btn => {
		btn.addEventListener('click', (e) => {
			const target = e.currentTarget as HTMLButtonElement;
			const avatarId = target.dataset.avatarId;
			const avatarSrc = target.dataset.avatarSrc;

			if (avatarId && avatarSrc) {
				onSelect(avatarId, avatarSrc);
				closeAvatarModal();
			}
		});
	});
}

export function closeAvatarModal(): void {
	const layer = document.getElementById('modal-layer');
	if (layer) {
		layer.innerHTML = '';
	}
}

export function getAvatarSrcFromId(gang: Gang, idOrPath: string | undefined | null): string {
	if (!idOrPath) return getDefaultAvatar(gang);

	const avatarList = avatarsByGang[gang];
	const foundAvatar = avatarList.find(av => av.id === idOrPath);

	if (foundAvatar) {
		return foundAvatar.src;
	}

	return idOrPath.includes('/') ? idOrPath : getDefaultAvatar(gang);
}
