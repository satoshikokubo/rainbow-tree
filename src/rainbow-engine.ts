import { App, TFolder } from "obsidian";
import { RainbowTreeSettings } from "./types";
import { assignColor, resolvePalette, hexToRgba } from "./color-utils";

const BARS_CONTAINER_CLS = "rainbow-tree-bars";
const BAR_CLS = "rainbow-tree-bar";
const ANIMATE_CLS = "rainbow-tree-animate";
const COLORED_CLS = "rainbow-tree-colored";

/** 祖先フォルダの色情報 */
interface AncestorInfo {
	/** 背景色のrgba文字列 — バーもこの色で表示 */
	rgba: string;
	/** 元のhex色 — 除外色チェック用 */
	hex: string;
}

/** 動的割り当て用：直前行の色情報 */
interface TraverseState {
	lastHex: string | null;
}


export class RainbowEngine {
	private app: App;
	private getSettings: () => RainbowTreeSettings;
	private observer: MutationObserver | null = null;
	private debounceTimer: number | null = null;
	private themeObserver: MutationObserver | null = null;
	private isUpdating = false;
	private scrollingUntil = 0;
	private scrollContainer: HTMLElement | null = null;
	/** refresh() 1回の間だけ使うキャッシュ（仮想スクロールのDOM差分に依存しないため） */
	private folderIndexCache = new Map<string, Map<string, number>>();
	private onScroll = () => {
		// スクロール中はバーのフェードインを抑制してチラつきを軽減
		this.scrollingUntil = performance.now() + 200;
	};

	constructor(app: App, getSettings: () => RainbowTreeSettings) {
		this.app = app;
		this.getSettings = getSettings;
	}

	start(): void {
		this.refresh();
		this.observeFileExplorer();
		this.observeThemeChange();
		this.observeScroll();
	}

	stop(): void {
		if (this.observer) { this.observer.disconnect(); this.observer = null; }
		if (this.themeObserver) { this.themeObserver.disconnect(); this.themeObserver = null; }
		if (this.debounceTimer !== null) { window.clearTimeout(this.debounceTimer); this.debounceTimer = null; }
		if (this.scrollContainer) {
			this.scrollContainer.removeEventListener("scroll", this.onScroll);
			this.scrollContainer = null;
		}
		this.removeAllBars();
	}

	refresh(): void {
		const settings = this.getSettings();
		if (!settings.enabled) { this.removeAllBars(); return; }
		this.folderIndexCache.clear();

		const treeRoot = this.getFileExplorerContainer();
		if (!treeRoot) return;

		this.isUpdating = true;

		const navContainer = this.getNavFilesContainer();
		if (navContainer) {
			navContainer.style.setProperty("--rainbow-bar-width", `${settings.barWidth}px`);
			navContainer.style.setProperty("--rainbow-bar-gap", `${settings.barGap}px`);
		}

		const resolvedPalette = resolvePalette(settings.palette);
		if (settings.colorMode === "dynamic") {
			const state: TraverseState = { lastHex: null };
			this.processContainerDynamic(treeRoot, [], resolvedPalette, settings, 0, state);
		} else {
			this.processContainerStable(treeRoot, [], resolvedPalette, settings, "", null);
		}

		requestAnimationFrame(() => { this.isUpdating = false; });
	}

	// ─── Private ─────────────────────────────────────────

	private getFileExplorerContainer(): HTMLElement | null {
		const leaves = this.app.workspace.getLeavesOfType("file-explorer");
		if (leaves.length === 0) return null;
		const nav = leaves[0].view.containerEl.querySelector(".nav-files-container") as HTMLElement | null;
		if (!nav) return null;
		if (nav.querySelector(":scope > .tree-item")) return nav;
		const firstChild = nav.firstElementChild as HTMLElement | null;
		if (firstChild && firstChild.querySelector(":scope > .tree-item")) return firstChild;
		return nav;
	}

	private getNavFilesContainer(): HTMLElement | null {
		const leaves = this.app.workspace.getLeavesOfType("file-explorer");
		if (leaves.length === 0) return null;
		return leaves[0].view.containerEl.querySelector(".nav-files-container") as HTMLElement | null;
	}

	private hashToIndex(key: string, mod: number): number {
		// FNV-1a 32-bit
		let hash = 0x811c9dc5;
		for (let i = 0; i < key.length; i++) {
			hash ^= key.charCodeAt(i);
			hash = Math.imul(hash, 0x01000193);
		}
		return mod === 0 ? 0 : (hash >>> 0) % mod;
	}

	private computeChildStartOffset(
		myHex: string,
		folderPath: string | null,
		resolvedPalette: string[],
	): number {
		const n = resolvedPalette.length;
		if (n === 0) return 0;

		let idx = resolvedPalette.indexOf(myHex);
		if (idx < 0) {
			// override色などでパレットに無い場合は、パス由来で安定したオフセットを作る
			idx = folderPath ? this.hashToIndex(folderPath, n) : 0;
		}
		// 親色と「親の次」を避けるため、子は +2 から開始
		return (idx + 2) % n;
	}

	private getStartOffsetForContainer(
		container: HTMLElement,
		startOffset: number,
	): number {
		// 保険：負値やNaNを正規化
		if (!Number.isFinite(startOffset) || startOffset < 0) return 0;
		return startOffset;
	}

	private processContainerStable(
		container: HTMLElement,
		ancestors: AncestorInfo[],
		resolvedPalette: string[],
		settings: RainbowTreeSettings,
		containerFolderPath: string,
		parentPaletteIndex: number | null,
	): void {
		const children = container.querySelectorAll(":scope > .tree-item");
		const n = resolvedPalette.length;
		const orderMap = this.getFolderChildIndexMap(containerFolderPath);
		let base = n > 0 ? this.hashToIndex(containerFolderPath || "ROOT", n) : 0;
		if (parentPaletteIndex !== null && n > 0) {
			base = (base + parentPaletteIndex + 2) % n;
			const blocked1 = parentPaletteIndex % n;
			const blocked2 = (parentPaletteIndex + 1) % n;
			let guard = 0;
			while ((base === blocked1 || base === blocked2) && guard < n) {
				base = (base + 1) % n;
				guard++;
			}
		}

		children.forEach((child) => {
			const treeItem = child as HTMLElement;
			const selfEl = treeItem.querySelector(":scope > .tree-item-self") as HTMLElement | null;
			if (!selfEl) return;

			const isFolder = treeItem.classList.contains("nav-folder");
			const isCollapsed = treeItem.classList.contains("is-collapsed");
			const folderPath = isFolder ? this.getFolderPath(treeItem) : null;
			const overrideColor = folderPath ? settings.folderColors[folderPath] : undefined;

			const nodePath = selfEl.getAttribute("data-path") ?? folderPath ?? "";
			const childIndex = n > 0 ? (orderMap.get(nodePath) ?? this.hashToIndex(nodePath, n)) : 0;
			const paletteIndex = n > 0 ? (base + childIndex) % n : 0;
			const myHex = overrideColor ?? (n > 0 ? resolvedPalette[paletteIndex] : "#000000");

			const myRgba = hexToRgba(myHex, settings.barOpacity);

			this.applyStyle(selfEl, ancestors, myRgba, settings);

			if (isFolder && !isCollapsed) {
				const childContainer = treeItem.querySelector(":scope > .tree-item-children") as HTMLElement | null;
				if (childContainer) {
					const newAncestors: AncestorInfo[] = [...ancestors, { rgba: myRgba, hex: myHex }];
					this.processContainerStable(childContainer, newAncestors, resolvedPalette, settings, nodePath, paletteIndex);
				}
			}
		});
	}

	private processContainerDynamic(
		container: HTMLElement,
		ancestors: AncestorInfo[],
		resolvedPalette: string[],
		settings: RainbowTreeSettings,
		startOffset: number,
		state: TraverseState,
	): void {
		const children = container.querySelectorAll(":scope > .tree-item");

		// 親色は除外
		const excludeParent = new Set<string>();
		if (ancestors.length > 0) {
			excludeParent.add(ancestors[ancestors.length - 1].hex);
		}

		const offset = this.getStartOffsetForContainer(container, startOffset);

		let siblingIndex = 0;

		children.forEach((child) => {
			const treeItem = child as HTMLElement;
			const selfEl = treeItem.querySelector(":scope > .tree-item-self") as HTMLElement | null;
			if (!selfEl) return;

			const isFolder = treeItem.classList.contains("nav-folder");
			const isCollapsed = treeItem.classList.contains("is-collapsed");
			const folderPath = isFolder ? this.getFolderPath(treeItem) : null;
			const overrideColor = folderPath ? settings.folderColors[folderPath] : undefined;

			// 直前行と同色を避ける（表示中の隣接重複を最小化）
			const exclude = new Set<string>(excludeParent);
			if (state.lastHex) exclude.add(state.lastHex);

			let myHex = assignColor(siblingIndex, resolvedPalette, exclude, overrideColor, offset);

			// 全色除外などで同色になった場合の保険：開始位置を1つずらして再トライ
			if (!overrideColor && state.lastHex && myHex === state.lastHex && resolvedPalette.length >= 2) {
				const alt = assignColor(siblingIndex, resolvedPalette, exclude, overrideColor, (offset + 1) % resolvedPalette.length);
				if (alt !== state.lastHex) myHex = alt;
			}

			siblingIndex++;

			const myRgba = hexToRgba(myHex, settings.barOpacity);

			this.applyStyle(selfEl, ancestors, myRgba, settings);

			// 次の“見た目上の行”のために更新（pre-order）
			state.lastHex = myHex;

			if (isFolder && !isCollapsed) {
				const childContainer = treeItem.querySelector(":scope > .tree-item-children") as HTMLElement | null;
				if (childContainer) {
					const newAncestors: AncestorInfo[] = [...ancestors, { rgba: myRgba, hex: myHex }];
					const childOffset = this.computeChildStartOffset(myHex, folderPath, resolvedPalette);
					this.processContainerDynamic(childContainer, newAncestors, resolvedPalette, settings, childOffset, state);
				}
			}
		});
	}

	/**
	 * tree-item-self にスタイルを適用
	 *
	 * 方式: 背景色を gradient で「バー領域は透明、右側だけ自分の色」にし、
	 *        バーは祖先の色（rgba）をそのまま表示。
	 *        バーと背景が重ならないので、色が混ざらない。
	 */
	private applyStyle(
	selfEl: HTMLElement,
	ancestors: AncestorInfo[],
	myRgba: string,
	settings: RainbowTreeSettings,
): void {
	const barWidth = settings.barWidth;
	const barGap = settings.barGap;
	const totalBarWidth = ancestors.length * (barWidth + barGap);

	// 変更がない要素は触らない（スクロール時のチラつき/再描画を抑制）
	const sig = `${ancestors.map((a) => a.rgba).join(",")}|${myRgba}|w=${totalBarWidth}|bw=${barWidth}|bg=${barGap}`;
	if (selfEl.dataset.rainbowSig === sig) return;
	selfEl.dataset.rainbowSig = sig;

	// 祖先0 かつ色無しはリセット
	if (ancestors.length === 0 && !myRgba) {
		selfEl.classList.remove(COLORED_CLS);
		selfEl.style.removeProperty("background");
		selfEl.style.removeProperty("background-color");
		const existing = selfEl.querySelector(`:scope > .${BARS_CONTAINER_CLS}`);
		if (existing) existing.remove();
		return;
	}

	selfEl.classList.add(COLORED_CLS);

	const existing = selfEl.querySelector(`:scope > .${BARS_CONTAINER_CLS}`) as HTMLElement | null;

	if (ancestors.length > 0) {
		// 背景: バー領域(左)は透明、右側だけ自分の色
		selfEl.style.setProperty(
			"background",
			`linear-gradient(to right, transparent ${totalBarWidth}px, ${myRgba} ${totalBarWidth}px)`,
		);
		selfEl.style.removeProperty("background-color");

		let barsContainer = existing;
		const isNew = !barsContainer;

		if (!barsContainer) {
			barsContainer = document.createElement("div");
			barsContainer.className = BARS_CONTAINER_CLS;
			selfEl.insertBefore(barsContainer, selfEl.firstChild);
		}

		// 既存要素の更新時は、アニメーションを再トリガーしない
		barsContainer.classList.remove(ANIMATE_CLS);
		if (isNew && settings.animateOnExpand && !this.isScrolling()) {
			barsContainer.classList.add(ANIMATE_CLS);
		}

		// 子要素数を合わせる
		while (barsContainer.childElementCount > ancestors.length) {
			barsContainer.lastElementChild?.remove();
		}
		while (barsContainer.childElementCount < ancestors.length) {
			const bar = document.createElement("span");
			bar.className = BAR_CLS;
			barsContainer.appendChild(bar);
		}

		// 色更新
		for (let i = 0; i < ancestors.length; i++) {
			const bar = barsContainer.children[i] as HTMLElement | undefined;
			if (!bar) continue;
			bar.style.setProperty("--rainbow-color", ancestors[i].rgba);
		}
	} else {
		// ルート直下（祖先なし）: 単純な背景色
		if (existing) existing.remove();
		selfEl.style.removeProperty("background");
		selfEl.style.setProperty("background-color", myRgba);
	}
}


	private getFolderPath(treeItem: HTMLElement): string | null {
		const selfEl = treeItem.querySelector(":scope > .tree-item-self") as HTMLElement | null;
		if (!selfEl) return null;
		return selfEl.getAttribute("data-path");
	}

	private observeFileExplorer(): void {
		const container = this.getNavFilesContainer();
		if (!container) return;
		this.observer = new MutationObserver((mutations) => {
			if (this.isUpdating) return;
			const isOnlyRainbow = mutations.every((m) =>
				Array.from(m.addedNodes).concat(Array.from(m.removedNodes)).every(
					(n) => n instanceof HTMLElement && (
						n.classList.contains(BARS_CONTAINER_CLS) ||
						n.classList.contains(BAR_CLS)
					)
				)
			);
			if (isOnlyRainbow) return;
			this.debouncedRefresh();
		});
		this.observer.observe(container, { childList: true, subtree: true });
	}

		private isScrolling(): boolean {
		return performance.now() < this.scrollingUntil;
	}

	private observeScroll(): void {
		const container = this.getNavFilesContainer();
		if (!container) return;
		// 重複登録防止
		if (this.scrollContainer) return;
		this.scrollContainer = container;
		container.addEventListener("scroll", this.onScroll, { passive: true });
	}

private observeThemeChange(): void {
		this.themeObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "attributes" && mutation.attributeName === "class") {
					this.debouncedRefresh();
					break;
				}
			}
		});
		this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
	}

	private debouncedRefresh(): void {
		if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
		// 100msに延長してレイアウト安定を待つ
		this.debounceTimer = window.setTimeout(() => { this.debounceTimer = null; this.refresh(); }, 100);
	}

	private removeAllBars(): void {
		const container = this.getNavFilesContainer();
		if (!container) return;
		container.querySelectorAll(`.${BARS_CONTAINER_CLS}`).forEach((el) => el.remove());
		container.querySelectorAll(`.${COLORED_CLS}`).forEach((el) => {
			const htmlEl = el as HTMLElement;
			htmlEl.classList.remove(COLORED_CLS);
			htmlEl.style.removeProperty("background");
			htmlEl.style.removeProperty("background-color");
			htmlEl.removeAttribute("data-rainbow-sig");
		});
	}

	private getFolderChildIndexMap(folderPath: string): Map<string, number> {
		const cached = this.folderIndexCache.get(folderPath);
		if (cached) return cached;

		const folder = folderPath ? this.app.vault.getAbstractFileByPath(folderPath) : this.app.vault.getRoot();
		if (!(folder instanceof TFolder)) {
			const empty = new Map<string, number>();
			this.folderIndexCache.set(folderPath, empty);
			return empty;
		}

		const children = folder.children.slice();
		// Obsidianの既定に近い：フォルダ優先 + 名前順（数値を自然順として扱う）
		children.sort((a, b) => {
			const aIsFolder = a instanceof TFolder;
			const bIsFolder = b instanceof TFolder;
			if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
			return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
		});

		const map = new Map<string, number>();
		children.forEach((c, i) => map.set(c.path, i));
		this.folderIndexCache.set(folderPath, map);
		return map;
	}
}
