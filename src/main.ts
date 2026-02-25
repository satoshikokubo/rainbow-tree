import { Menu, Plugin, TFolder } from "obsidian";
import { RainbowTreeSettings, DEFAULT_SETTINGS } from "./types";
import { RainbowTreeSettingTab } from "./settings";
import { RainbowEngine } from "./rainbow-engine";
import { t } from "./i18n";

export default class RainbowTreePlugin extends Plugin {
	settings: RainbowTreeSettings = DEFAULT_SETTINGS;
	private engine: RainbowEngine | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// 設定タブ登録
		this.addSettingTab(new RainbowTreeSettingTab(this.app, this));

		// レイアウト準備完了後にエンジン起動
		this.app.workspace.onLayoutReady(() => {
			this.startEngine();
		});

		// ファイルエクスプローラーのコンテキストメニュー拡張
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (!(file instanceof TFolder)) return;

				const folderPath = file.path;
				const hasOverride = folderPath in this.settings.folderColors;

				menu.addItem((item) => {
					item.setTitle(t.menuSetColor)
						.setIcon("palette")
						.onClick(() => {
							this.showColorPicker(folderPath);
						});
				});

				if (hasOverride) {
					menu.addItem((item) => {
						item.setTitle(t.menuResetColor)
							.setIcon("rotate-ccw")
							.onClick(async () => {
								delete this.settings.folderColors[folderPath];
								await this.saveSettings();
							});
					});
				}
			})
		);
	}

	onunload(): void {
		this.stopEngine();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// 設定変更時にエンジンをリフレッシュ
		if (this.engine) {
			this.engine.refresh();
		}
	}

	private startEngine(): void {
		this.engine = new RainbowEngine(this.app, () => this.settings);
		this.engine.start();
	}

	private stopEngine(): void {
		if (this.engine) {
			this.engine.stop();
			this.engine = null;
		}
	}

	/**
	 * カラーピッカーをシンプルなプロンプトで表示
	 * （Phase 2でモーダルに差し替え予定）
	 */
	private async showColorPicker(folderPath: string): Promise<void> {
		// 暫定: input[type=color] を使った簡易ピッカー
		const input = document.createElement("input");
		input.type = "color";
		input.value = this.settings.folderColors[folderPath] || "#E53935";
		input.style.position = "fixed";
		input.style.opacity = "0";
		input.style.pointerEvents = "none";
		document.body.appendChild(input);

		input.addEventListener("change", async () => {
			this.settings.folderColors[folderPath] = input.value;
			await this.saveSettings();
			input.remove();
		});

		input.addEventListener("blur", () => {
			// ピッカーを閉じたら要素除去
			setTimeout(() => input.remove(), 100);
		});

		input.click();
	}
}
