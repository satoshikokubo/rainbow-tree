/** 個別パレットカラー */
export interface PaletteColor {
	name: string;
	dark: string;   // hex
	light: string;  // hex
}

/** プラグイン設定 */
export interface RainbowTreeSettings {
	/** カラーパレット */
	palette: PaletteColor[];

	/** バー幅 px (2〜8) */
	barWidth: number;

	/** バー不透明度 (0.0〜1.0) */
	barOpacity: number;

	/** バー間ギャップ px (0〜4) */
	barGap: number;

	/** プラグイン有効/無効 */
	enabled: boolean;

	/** 展開時フェードインアニメーション */
	animateOnExpand: boolean;

	/** フォルダパス → 手動指定色 (hex) */
	folderColors: Record<string, string>;
}

/** デフォルトパレット（6色） */
export const DEFAULT_PALETTE: PaletteColor[] = [
	{ name: "Red",    dark: "#E53935", light: "#C62828" },
	{ name: "Green",  dark: "#43A047", light: "#2E7D32" },
	{ name: "Blue",   dark: "#1E88E5", light: "#1565C0" },
	{ name: "Orange", dark: "#FB8C00", light: "#E65100" },
	{ name: "Purple", dark: "#8E24AA", light: "#6A1B9A" },
	{ name: "Cyan",   dark: "#00ACC1", light: "#00838F" },
];

/** デフォルト設定 */
export const DEFAULT_SETTINGS: RainbowTreeSettings = {
	palette: [...DEFAULT_PALETTE],
	barWidth: 4,
	barOpacity: 0.85,
	barGap: 0,
	enabled: true,
	animateOnExpand: true,
	folderColors: {},
};
