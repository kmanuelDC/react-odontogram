declare module "react-native-svg" {
	import type { ComponentType, ReactNode } from "react";

	type SvgElementProps = {
		[key: string]: unknown;
		children?: ReactNode;
	};

	const Svg: ComponentType<SvgElementProps>;

	export const Circle: ComponentType<SvgElementProps>;
	export const G: ComponentType<SvgElementProps>;
	export const Line: ComponentType<SvgElementProps>;
	export const Path: ComponentType<SvgElementProps>;
	export const Rect: ComponentType<SvgElementProps>;
	export const Text: ComponentType<SvgElementProps>;

	export default Svg;
}
