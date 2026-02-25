import { App, TFolder } from "obsidian";
import { RainbowTreeSettings } from "./types";
import { assignColor, resolvePalette } from "./color-utils";

/** カラーバーコンテナのCSSクラス */
const BARS_CONTAINER_CLS = "rainbow-tree-bars";
/** 個別バー要素のCSSクラス */
const BAR_CLS = "rainbow-tree-bar";
/** アニメーション用クラス */
const ANIMATE_CLS = "rainbow-tree-animate";

/**
 * RainbowEngine
 *
 * ファイルエクスプローラーのDOMを監視し、カラーバーを注入・管理する。
 */
export class RainbowEngine {
	private app: App;
	private getSettings: () => RainbowTreeSettings;
	private observer: MutationObserver | null = null;
	private debounceTimer: number | null = null;
	private themeObserver: MutationObserver | null = null;

	constructor(app: App, getSettings: () => RainbowTreeSettings) {
		this.app = app;
		this.getSettings = getSettings;
	}

	/**
	 * エンジン起動: DOMにカラーバーを注入し、監視を開始
	 */
	start(): void {
		// 初回レンダリング
		this.refresh();

		// ファイルエクスプローラーのDOM変更を監視
		this.observeFileExplorer();

		// テーマ切り替えを監視
		this.observeThemeChange();
	}

	/**
	 * エンジン停止: 監視を切断し、注入したDOMを除去
	 */
	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		if (this.themeObserver) {
			this.themeObserver.disconnect();
			this.themeObserver = null;
		}
		if (this.debounceTimer !== null) {
			window.clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		this.removeAllBars();
	}

	/**
	 * 全カラーバーを再計算・再描画
	 */
	refresh(): void {
		const settings = this.getSettings();
		if (!settings.enabled) {
			this.removeAllBars();
			return;
		}

		const container = this.getFileExplorerContainer();
		if (!container) return;

		// CSS カスタムプロパティをルートに設定
		this.applyCssProperties(container, settings);

		// 全 tree-item-self にカラーバーを注入
		const resolvedPalette = resolvePalette(settings.palette);
		this.processContainer(container, [], resolvedPalette, settings);
	}

	// ─── Private ─────────────────────────────────────────

	/**
	 * ファイルエクスプローラーのコンテナ要素を取得
	 */
	private getFileExplorerContainer(): HTMLElement | null {
		const leaves = this.app.workspace.getLeavesOfType("file-explorer");
		if (leaves.length === 0) return null;
		return leaves[0].view.containerEl.querySelector(
			".nav-files-container"
		) as HTMLElement | null;
	}

	/**
	 * CSS カスタムプロパティを設定
	 */
	private applyCssProperties(container: HTMLElement, settings: RainbowTreeSettings): void {
		container.style.setProperty("--rainbow-bar-width", `${settings.barWidth}px`);
		container.style.setProperty("--rainbow-bar-opacity", `${settings.barOpacity}`);
		container.style.setProperty("--rainbow-bar-gap", `${settings.barGap}px`);
	}

	/**
	 * コンテナ内のツリーアイテムを再帰処理してカラーバーを注入
	 *
	 * @param container     処理対象のコンテナ
	 * @param ancestorColors 祖先フォルダの色の配列（ルートから順）
	 * @param resolvedPalette テーマ解決済みパレット
	 * @param settings       現在の設定
	 */
	private processContainer(
		container: HTMLElement,
		ancestorColors: string[],
		resolvedPalette: string[],
		settings: RainbowTreeSettings,
	): void {
		// 直下の tree-item のみ取得（子孫は再帰で処理）
		const children = container.querySelectorAll(":scope > .tree-item");
		let prevColor: string | null = null;

		children.forEach((child, index) => {
			const treeItem = child as HTMLElement;
			const selfEl = treeItem.querySelector(":scope > .tree-item-self") as HTMLElement | null;
			if (!selfEl) return;

			// このアイテムがフォルダかどうか判定
			const isFolder = treeItem.classList.contains("nav-folder");

			// フォルダの場合: 色を割り当て
			let myColor: string | null = null;
			if (isFolder) {
				const folderPath = this.getFolderPath(treeItem);
				const overrideColor = folderPath ? settings.folderColors[folderPath] : undefined;
				myColor = assignColor(index, prevColor, resolvedPalette, overrideColor);
				prevColor = myColor;
			}

			// カラーバーを注入（祖先の色のみ。自分自身の色はバーに含まない）
			this.injectBars(selfEl, ancestorColors, settings.animateOnExpand);

			// フォルダが展開されている場合、子要素を再帰処理
			if (isFolder && myColor) {
				const childContainer = treeItem.querySelector(
					":scope > .tree-item-children"
				) as HTMLElement | null;

				if (childContainer) {
					const newAncestorColors = [...ancestorColors, myColor];
					this.processContainer(childContainer, newAncestorColors, resolvedPalette, settings);
				}
			}
		});
	}

	/**
	 * tree-item-self にカラーバーコンテナを注入
	 */
	private injectBars(selfEl: HTMLElement, colors: string[], animate: boolean): void {
		// 既存のバーコンテナがあれば除去
		const existing = selfEl.querySelector(`.${BARS_CONTAINER_CLS}`);
		if (existing) existing.remove();

		// 色がなければバー不要
		if (colors.length === 0) return;

		// バーコンテナ生成
		const barsContainer = document.createElement("div");
		barsContainer.className = BARS_CONTAINER_CLS;
		if (animate) barsContainer.classList.add(ANIMATE_CLS);

		// 各階層の色に対応するバー要素を生成
		for (const color of colors) {
			const bar = document.createElement("span");
			bar.className = BAR_CLS;
			bar.style.setProperty("--rainbow-color", color);
			barsContainer.appendChild(bar);
		}

		// selfElの先頭に挿入
		selfEl.insertBefore(barsContainer, selfEl.firstChild);

		// selfElにposition: relativeを付与（バーのabsolute配置のため）
		if (!selfEl.style.position) {
			selfEl.style.position = "relative";
		}
	}

	/**
	 * tree-itemからフォルダパスを取得
	 */
	private getFolderPath(treeItem: HTMLElement): string | null {
		// Obsidianはdata-path属性にパスを格納している
		const selfEl = treeItem.querySelector(":scope > .tree-item-self") as HTMLElement | null;
		if (!selfEl) return null;
		return selfEl.getAttribute("data-path");
	}

	/**
	 * ファイルエクスプローラーのDOM変更を監視
	 */
	private observeFileExplorer(): void {
		const container = this.getFileExplorerContainer();
		if (!container) return;

		this.observer = new MutationObserver(() => {
			this.debouncedRefresh();
		});

		this.observer.observe(container, {
			childList: true,
			subtree: true,
		});
	}

	/**
	 * テーマ切り替えを監視（body.classListの変更）
	 */
	private observeThemeChange(): void {
		this.themeObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (
					mutation.type === "attributes" &&
					mutation.attributeName === "class"
				) {
					this.debouncedRefresh();
					break;
				}
			}
		});

		this.themeObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ["class"],
		});
	}

	/**
	 * debounce付きリフレッシュ（50ms）
	 */
	private debouncedRefresh(): void {
		if (this.debounceTimer !== null) {
			window.clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = window.setTimeout(() => {
			this.debounceTimer = null;
			this.refresh();
		}, 50);
	}

	/**
	 * 全カラーバー要素を除去
	 */
	private removeAllBars(): void {
		const container = this.getFileExplorerContainer();
		if (!container) return;

		container.querySelectorAll(`.${BARS_CONTAINER_CLS}`).forEach((el) => el.remove());
	}
}
