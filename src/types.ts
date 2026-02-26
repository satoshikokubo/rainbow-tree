/** 色割り当てモード */
export type ColorMode = "stable" | "dynamic";

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

	/** バー幅 px (2〜16) */
	barWidth: number;

	/** バー不透明度 (0.0〜1.0) */
	barOpacity: number;

	/** バー間ギャップ px (0〜4) */
	barGap: number;

	/** プラグイン有効/無効 */
	enabled: boolean;

	/** 色割り当てモード */
	colorMode: ColorMode;

	/** 展開時フェードインアニメーション */
	animateOnExpand: boolean;

	/** 行間（ツリーの各行の隙間）を詰める */
	compactRows: boolean;

	/** フォルダパス → 手動指定色 (hex) */
	folderColors: Record<string, string>;
}

/** デフォルトパレット（7色・虹順・パステル調） */
export const DEFAULT_PALETTE: PaletteColor[] = [
	{ name: "Red",    dark: "#C87070", light: "#E8A0A0" },
	{ name: "Orange", dark: "#C89860", light: "#E8C090" },
	{ name: "Yellow", dark: "#B8B060", light: "#E0D890" },
	{ name: "Green",  dark: "#60A878", light: "#90D0A8" },
	{ name: "Blue",   dark: "#6098C0", light: "#90C0E0" },
	{ name: "Indigo", dark: "#7878B8", light: "#A0A0D8" },
	{ name: "Violet", dark: "#A878C0", light: "#D0A8E0" },
];

/** デフォルト設定 */
export const DEFAULT_SETTINGS: RainbowTreeSettings = {
	palette: [...DEFAULT_PALETTE],
	barWidth: 16,
	barOpacity: 0.25,
	barGap: 3,
	enabled: true,
	colorMode: "stable",
	animateOnExpand: true,
	compactRows: false,
	folderColors: {},
};
