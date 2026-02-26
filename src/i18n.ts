import { moment } from "obsidian";

/** 対応言語 */
type Lang = "ja" | "en";

/** 現在の言語を取得 */
function getLang(): Lang {
	const locale = moment.locale();
	return locale?.startsWith("ja") ? "ja" : "en";
}

/** 辞書型 */
interface Dict {
	// 設定画面
	settingHeading: string;
	settingPalette: string;
	settingPaletteDesc: string;
	settingAddColor: string;
	settingResetPalette: string;
	settingBarWidth: string;
	settingBarWidthDesc: string;
	settingBarOpacity: string;
	settingBarOpacityDesc: string;
	settingBarGap: string;
	settingBarGapDesc: string;
	settingEnabled: string;
	settingEnabledDesc: string;
	settingColorMode: string;
	settingColorModeDesc: string;
	settingColorModeStable: string;
	settingColorModeDynamic: string;
	settingAnimate: string;
	settingAnimateDesc: string;
	settingCompactRows: string;
	settingCompactRowsDesc: string;
	settingResetOverrides: string;
	settingResetOverridesDesc: string;
	settingColorName: string;
	settingDarkColor: string;
	settingLightColor: string;

	// コンテキストメニュー
	menuSetColor: string;
	menuResetColor: string;

	// カラーピッカーモーダル
	modalTitle: string;
	modalCustomColor: string;
	modalApply: string;
	modalCancel: string;
}

const ja: Dict = {
	settingHeading: "Rainbow Tree 設定",
	settingPalette: "カラーパレット",
	settingPaletteDesc: "階層バーに使用する色を管理します。",
	settingAddColor: "色を追加",
	settingResetPalette: "デフォルトに戻す",
	settingBarWidth: "バー幅",
	settingBarWidthDesc: "カラーバーの幅（px）。",
	settingBarOpacity: "バー不透明度",
	settingBarOpacityDesc: "カラーバーの不透明度。",
	settingBarGap: "バー間ギャップ",
	settingBarGapDesc: "カラーバー間の隙間（px）。",
	settingEnabled: "Rainbow Treeを有効化",
	settingEnabledDesc: "ファイルエクスプローラーにカラーバーを表示します。",
	settingColorMode: "色割り当てモード",
	settingColorModeDesc: "色を固定するか、表示上の隣接行の重複を最小化するかを選びます。",
	settingColorModeStable: "安定（固定）",
	settingColorModeDynamic: "動的（隣接最適化）",
	settingAnimate: "展開アニメーション",
	settingAnimateDesc: "フォルダ展開時にフェードインアニメーションを適用します。",
	settingCompactRows: "行間を詰める",
	settingCompactRowsDesc:
		"ファイルエクスプローラーの各行の隙間を詰めます（テーマの余白設定を上書きします）。",
	settingResetOverrides: "手動カラー設定をリセット",
	settingResetOverridesDesc: "フォルダごとに手動設定した色をすべてクリアします。",
	settingColorName: "色の名前",
	settingDarkColor: "ダーク",
	settingLightColor: "ライト",

	menuSetColor: "Rainbow Treeの色を設定",
	menuResetColor: "Rainbow Treeの色をリセット",

	modalTitle: "Rainbow Tree: 色を選択",
	modalCustomColor: "カスタムカラー",
	modalApply: "適用",
	modalCancel: "キャンセル",
};

const en: Dict = {
	settingHeading: "Rainbow Tree Settings",
	settingPalette: "Color Palette",
	settingPaletteDesc: "Manage the colors used for indent bars.",
	settingAddColor: "Add Color",
	settingResetPalette: "Reset to Default",
	settingBarWidth: "Bar Width",
	settingBarWidthDesc: "Width of the color bars (px).",
	settingBarOpacity: "Bar Opacity",
	settingBarOpacityDesc: "Opacity of the color bars.",
	settingBarGap: "Bar Gap",
	settingBarGapDesc: "Gap between color bars (px).",
	settingEnabled: "Enable Rainbow Tree",
	settingEnabledDesc: "Show color bars in the file explorer.",
	settingColorMode: "Color assignment mode",
	settingColorModeDesc: "Choose whether colors stay stable or are optimized to reduce adjacent duplicates.",
	settingColorModeStable: "Stable (fixed)",
	settingColorModeDynamic: "Dynamic (adjacency optimized)",
	settingAnimate: "Expand animation",
	settingAnimateDesc: "Apply fade-in animation when expanding folders.",
	settingCompactRows: "Compact row spacing",
	settingCompactRowsDesc:
		"Reduce vertical gaps between rows in the file explorer (overrides some theme spacing).",
	settingResetOverrides: "Reset folder color overrides",
	settingResetOverridesDesc: "Clear all manually set folder colors.",
	settingColorName: "Color name",
	settingDarkColor: "Dark",
	settingLightColor: "Light",

	menuSetColor: "Set Rainbow Color",
	menuResetColor: "Reset Rainbow Color",

	modalTitle: "Rainbow Tree: Choose a color",
	modalCustomColor: "Custom Color",
	modalApply: "Apply",
	modalCancel: "Cancel",
};

/** 翻訳辞書（現在の言語） */
export const t: Dict = getLang() === "ja" ? ja : en;

/** 現在の言語を外部から参照 */
export const lang: Lang = getLang();
