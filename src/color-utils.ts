import { PaletteColor } from "./types";

/**
 * 現在のテーマがダークかどうかを判定
 */
export function isDarkTheme(): boolean {
	return document.body.classList.contains("theme-dark");
}

/**
 * PaletteColorからテーマに応じたhex色を取得
 */
export function resolveColor(color: PaletteColor): string {
	return isDarkTheme() ? color.dark : color.light;
}

/**
 * パレットから解決済みhex色の配列を生成
 */
export function resolvePalette(palette: PaletteColor[]): string[] {
	return palette.map(resolveColor);
}

/**
 * フォルダに色を割り当てる
 *
 * @param siblingIndex    兄弟内でのインデックス（0始まり）
 * @param prevColor       直前の兄弟に割り当てた色（null = 先頭）
 * @param resolvedPalette テーマ解決済みのhex色配列
 * @param overrideColor   手動オーバーライド色（あれば最優先）
 * @returns 割り当てるhex色
 */
export function assignColor(
	siblingIndex: number,
	prevColor: string | null,
	resolvedPalette: string[],
	overrideColor?: string,
): string {
	// 手動オーバーライドがあれば最優先
	if (overrideColor) return overrideColor;

	if (resolvedPalette.length === 0) return "#888888";
	if (resolvedPalette.length === 1) return resolvedPalette[0];

	let colorIndex = siblingIndex % resolvedPalette.length;
	const candidate = resolvedPalette[colorIndex];

	// 直前の兄弟と同じ色なら次へスキップ
	if (prevColor && candidate === prevColor) {
		colorIndex = (colorIndex + 1) % resolvedPalette.length;
	}

	return resolvedPalette[colorIndex];
}
