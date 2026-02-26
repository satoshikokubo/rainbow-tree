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
 * 6桁hexをrgba文字列に変換
 */
export function hexToRgba(hex: string, alpha: number): string {
	// 8桁hexの場合は6桁に切り詰め
	const h = hex.startsWith("#") ? hex.slice(1) : hex;
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * フォルダ/ファイルに色を割り当てる（パレット順にローテーション）
 * 除外色をスキップしながらフルパレット上を走査する。
 * これにより「available配列が縮んでローテが崩れる」問題を回避。
 *
 * @param siblingIndex    兄弟内でのインデックス（0始まり）
 * @param resolvedPalette テーマ解決済みのhex色配列
 * @param excludeColors   避けるべき色のセット（親の色など）
 * @param overrideColor   手動オーバーライド色（あれば最優先）
 * @returns 割り当てるhex色
 */
export function assignColor(
	siblingIndex: number,
	resolvedPalette: string[],
	excludeColors: Set<string>,
	overrideColor?: string,
	startOffset: number = 0,
): string {
	if (overrideColor) return overrideColor;
	if (resolvedPalette.length === 0) return "#88888840";

	// フルパレット上を走査し、除外色はカウントせずスキップ
	let count = 0;
	let idx = startOffset;
	while (true) {
		const color = resolvedPalette[idx % resolvedPalette.length];
		if (!excludeColors.has(color)) {
			if (count === siblingIndex) return color;
			count++;
		}
		idx++;
		// 無限ループ防止（全色除外された場合）
		if (idx >= resolvedPalette.length * 2) {
			return resolvedPalette[(startOffset + siblingIndex) % resolvedPalette.length];
		}
	}
}
