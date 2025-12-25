interface FormProps {
	id: string;
	children: string;
	className?: string;
}

export function Form({ id, children, className = ""} : FormProps) {
	return `
		<form
			id="${id}"
			class="${className}"
			novalidate
		>
			${children}
		</form>
	`;
}
