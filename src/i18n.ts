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
	settingAnimate: string;
	settingAnimateDesc: string;
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
	settingAnimate: "展開アニメーション",
	settingAnimateDesc: "フォルダ展開時にフェードインアニメーションを適用します。",
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
	settingAnimate: "Expand Animation",
	settingAnimateDesc: "Apply fade-in animation when expanding folders.",
	settingResetOverrides: "Reset Folder Color Overrides",
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
