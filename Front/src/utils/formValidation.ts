import { ZodError, z } from 'zod';

export function validateForm<T>(
	schema: z.ZodType<T>,
	data: any
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
	try {
		const validData = schema.parse(data);
		return { success: true, data: validData };
	} catch (error) {
		if (error instanceof ZodError) {
			const errors: Record<string, string> = {};
			error.issues.forEach(issue => {
				const field = issue.path.join('.');
				errors[field] = issue.message;
			});
			return { success: false, errors };
		}
		throw error;
	}
}

export function clearFormErrors(formId: string) {
	const form = document.getElementById(formId);
	if (!form) return;

	form.querySelectorAll('.error-message').forEach(el => el.remove());
	form.querySelectorAll('.border-red-500, .border-red-400').forEach(el => {
		el.classList.remove('border-red-500', 'border-red-400');
		el.classList.add('border-cyan-500/50');
	});
}

export function displayFormErrors(formId: string, errors: Record<string, string>) {
	clearFormErrors(formId);

	Object.entries(errors).forEach(([field, message]) => {
		const input = document.getElementById(`input-${formId.replace('form-', '')}-${field}`);
		if (!input) {
			console.warn(`Input não encontrado: input-${formId.replace('form-', '')}-${field}`);
			return;
		}

		input.classList.remove('border-cyan-500/50');
		input.classList.add('border-red-500', 'focus:border-red-400');

		const errorEl = document.createElement('p');
		errorEl.className = 'error-message text-red-400 text-sm mt-1 ml-1';
		errorEl.textContent = message;
		input.parentElement?.appendChild(errorEl);
	});

	if (errors.gang) {
		const wrapper = document.getElementById('wrapper-select-register-gang');
		if (wrapper) {
			const trigger = document.getElementById('trigger-select-register-gang');
			trigger?.classList.remove('border-cyan-500/50');
			trigger?.classList.add('border-red-500');

			const errorEl = document.createElement('p');
			errorEl.className = 'error-message text-red-400 text-sm mt-1 ml-1';
			errorEl.textContent = errors.gang;
			wrapper.appendChild(errorEl);
		}
	}
}
