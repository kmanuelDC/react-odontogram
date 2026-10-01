import type { OdontogramLayout } from "./layout";

/** Dentitions that have an SVG composition available to the component. */
export type RenderableDentition = "permanent" | "primary" | "mixed";

/**
 * Only these combinations may select a dataset and a composition internally.
 * Every listed combination has its own geometry and layout definition.
 */
export type SupportedDentitionLayout = {
	dentition: RenderableDentition;
	layout: OdontogramLayout;
};

export interface DentitionLayoutResolution {
	requested: SupportedDentitionLayout;
	resolved: SupportedDentitionLayout;
	fellBack: boolean;
}

export const supportedLayoutsByDentition = {
	permanent: ["arch", "horizontal"],
	primary: ["arch", "horizontal"],
	mixed: ["arch", "horizontal"],
} as const satisfies Readonly<
	Record<RenderableDentition, readonly OdontogramLayout[]>
>;

export function isLayoutSupported(
	dentition: RenderableDentition,
	layout: OdontogramLayout,
): boolean {
	return (
		supportedLayoutsByDentition[dentition] as readonly OdontogramLayout[]
	).includes(layout);
}

/**
 * Resolves a public request into a combination that has its own dataset and
 * composition. Primary horizontal became available with its independent data.
 */
export function resolveDentitionLayout(
	dentition: RenderableDentition,
	layout: OdontogramLayout,
): DentitionLayoutResolution {
	const requested = { dentition, layout };

	return {
		requested,
		resolved: requested,
		fellBack: false,
	};
}
