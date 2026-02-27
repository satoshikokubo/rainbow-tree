import { App, PluginSettingTab, Setting } from "obsidian";
import type RainbowTreePlugin from "./main";
import { DEFAULT_PALETTE, PaletteColor } from "./types";
import { t } from "./i18n";

export class RainbowTreeSettingTab extends PluginSettingTab {
	plugin: RainbowTreePlugin;

	constructor(app: App, plugin: RainbowTreePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ─── Enable / Disable ───
		new Setting(containerEl)
			.setName(t.settingEnabled)
			.setDesc(t.settingEnabledDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				})
			);

		// ─── Color Assignment Mode ───
		new Setting(containerEl)
			.setName(t.settingColorMode)
			.setDesc(t.settingColorModeDesc)
			.addDropdown((dd) => {
				dd.addOption("stable", t.settingColorModeStable);
				dd.addOption("dynamic", t.settingColorModeDynamic);
				dd.setValue(this.plugin.settings.colorMode ?? "stable");
				dd.onChange(async (value) => {
					this.plugin.settings.colorMode = value as "stable" | "dynamic";
					await this.plugin.saveSettings();
				});
			});

		// ─── Color Palette ───
		new Setting(containerEl)
			.setName(t.settingPalette)
			.setDesc(t.settingPaletteDesc)
			.setHeading();

		// Dark/Light ヘッダー行
		const headerRow = containerEl.createDiv({ cls: "setting-item" });
		const headerInfo = headerRow.createDiv({ cls: "setting-item-info" });
		headerInfo.createEl("div", { text: "", cls: "setting-item-name" });
		const headerControl = headerRow.createDiv({ cls: "setting-item-control rainbow-tree-palette-header" });
		headerControl.createSpan({ text: t.settingDarkColor });
		headerControl.createSpan({ text: t.settingLightColor });
		headerControl.createSpan({ text: "" }); // trash spacer

		this.plugin.settings.palette.forEach((color, index) => {
			this.renderPaletteItem(containerEl, color, index);
		});

		// Add Color ボタン
		new Setting(containerEl).addButton((btn) =>
			btn.setButtonText(t.settingAddColor).onClick(async () => {
				this.plugin.settings.palette.push({
					name: `Color ${this.plugin.settings.palette.length + 1}`,
					dark: "#888888",
					light: "#666666",
				});
				await this.plugin.saveSettings();
				this.display();
			})
		);

		// Reset Palette ボタン
		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText(t.settingResetPalette)
				.setWarning()
				.onClick(async () => {
					this.plugin.settings.palette = [...DEFAULT_PALETTE];
					await this.plugin.saveSettings();
					this.display();
				})
		);

		// ─── Bar Style ───
		new Setting(containerEl)
			.setName(t.settingBarStyle)
			.setHeading();

		new Setting(containerEl)
			.setName(t.settingBarWidth)
			.setDesc(t.settingBarWidthDesc)
			.addSlider((slider) =>
				slider
					.setLimits(2, 16, 1)
					.setValue(this.plugin.settings.barWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.barWidth = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.settingBarOpacity)
			.setDesc(t.settingBarOpacityDesc)
			.addSlider((slider) =>
				slider
					.setLimits(0.1, 1.0, 0.05)
					.setValue(this.plugin.settings.barOpacity)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.barOpacity = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.settingBarGap)
			.setDesc(t.settingBarGapDesc)
			.addSlider((slider) =>
				slider
					.setLimits(0, 4, 1)
					.setValue(this.plugin.settings.barGap)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.barGap = value;
						await this.plugin.saveSettings();
					})
			);

		// ─── Behavior ───
		new Setting(containerEl)
			.setName(t.settingBehavior)
			.setHeading();

		new Setting(containerEl)
			.setName(t.settingAnimate)
			.setDesc(t.settingAnimateDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.animateOnExpand).onChange(async (value) => {
					this.plugin.settings.animateOnExpand = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t.settingCompactRows)
			.setDesc(t.settingCompactRowsDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.compactRows).onChange(async (value) => {
					this.plugin.settings.compactRows = value;
					await this.plugin.saveSettings();
				})
			);

		// ─── Advanced ───
		new Setting(containerEl)
			.setName(t.settingAdvanced)
			.setHeading();

		const overrideCount = Object.keys(this.plugin.settings.folderColors).length;
		new Setting(containerEl)
			.setName(t.settingResetOverrides)
			.setDesc(
				`${t.settingResetOverridesDesc} (${overrideCount} folder${overrideCount !== 1 ? "s" : ""})`
			)
			.addButton((btn) =>
				btn
					.setButtonText(t.settingReset)
					.setWarning()
					.setDisabled(overrideCount === 0)
					.onClick(async () => {
						this.plugin.settings.folderColors = {};
						await this.plugin.saveSettings();
						this.display();
					})
			);
	}

	/**
	 * パレット1色分のUIを描画
	 */
	private renderPaletteItem(
		containerEl: HTMLElement,
		color: PaletteColor,
		index: number,
	): void {
		new Setting(containerEl)
			.setName(color.name)
			.addColorPicker((picker) =>
				picker.setValue(color.dark).onChange(async (value) => {
					this.plugin.settings.palette[index].dark = value;
					await this.plugin.saveSettings();
				})
			)
			.addColorPicker((picker) =>
				picker.setValue(color.light).onChange(async (value) => {
					this.plugin.settings.palette[index].light = value;
					await this.plugin.saveSettings();
				})
			)
			.addExtraButton((btn) =>
				btn.setIcon("trash-2").setTooltip(t.settingDelete).onClick(async () => {
					this.plugin.settings.palette.splice(index, 1);
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}
}
