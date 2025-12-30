import { ModalComponent } from "@/components/Modal";
import { Button } from "@/components/Button";

interface ShowModalOptions {
	title: string;
	message: string;
	type?: "success" | "danger" | "info";
	confirmText?: string;
	cancelText?: string;
	onConfirm?: () => void;
}

export function showModal({
	title,
	message,
	type = "info",
	confirmText = "OK",
	cancelText,
	onConfirm
}: ShowModalOptions) {

	const layer = document.getElementById("modal-layer");
	if (!layer)
		return;

	layer.innerHTML = ModalComponent({ title, message, type });

	const actionsContainer = document.getElementById("modal-actions");

	if (actionsContainer) {
		if (cancelText) {
			const cancelBtnHTML = Button({
				id: "modal-btn-cancel",
				text: cancelText,
				variant: "secondary",
				className: "flex-1"
			});
			actionsContainer.insertAdjacentHTML('beforeend', cancelBtnHTML);
		}

		const confirmBtnHTML = Button({
			id: "modal-btn-confirm",
			text: confirmText,
			variant: type === "danger" ? "danger" : "primary",
			className: "flex-1"
		});
		actionsContainer.insertAdjacentHTML('beforeend', confirmBtnHTML);
	}

	document.getElementById("modal-btn-cancel")?.addEventListener("click", () => {
		closeModal();
	});

	document.getElementById("modal-btn-confirm")?.addEventListener("click", () => {
		closeModal();
		if (onConfirm)
			onConfirm();
	});
}

function closeModal() {
	const layer = document.getElementById("modal-layer");
	if (layer)
		layer.innerHTML = "";
}
