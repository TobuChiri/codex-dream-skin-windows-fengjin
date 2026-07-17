import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const windowsRoot = path.resolve(here, "..");
const template = await fs.readFile(path.join(windowsRoot, "assets", "renderer-inject.js"), "utf8");
const payload = template
  .replace("__DREAM_CSS_JSON__", JSON.stringify(".fixture { color: blue; }"))
  .replace("__DREAM_ART_JSON__", JSON.stringify("data:image/png;base64,AA=="))
  .replace("__DREAM_THEME_JSON__", JSON.stringify({
    id: "fixture-theme",
    brandTitle: "Fixture",
    brandSubtitle: "Test",
    heroTitle: "Fixture hero",
    tagline: "Theme tagline",
    signature: "Fixture Skin",
    projectPrefix: "Project · ",
    projectLabel: "Choose project",
    design: {
      textSide: "right",
      decoration: "geometric",
      focalX: 0.31,
      focalY: 0.44,
      heroHeight: 260,
      cornerRadius: 20,
      cardRadius: 18,
      decorationDensity: 0.5,
      overlayStrength: 0.7,
      showPolaroid: false,
    },
    motifs: {
      pattern: "floral",
      emblem: "wing",
      cornerMark: "01",
      badge: "VIRTUAL SINGER",
      code: "MELODY // LYRICS",
      brandGlyph: "✿",
      accentGlyph: "✦",
      glyphs: ["01", "MIKU", "♫"],
    },
  }));

function createFixture({ shellPresent, staleSkin = false }) {
  const nodes = new Map();
  const rootClasses = new Set(staleSkin ? ["codex-dream-skin"] : []);
  const rootStyles = new Map(staleSkin ? [["--dream-art", "url(\"blob:stale\")"]] : []);
  const revokedUrls = [];
  const newTaskClasses = new Set();
  let hasShell = shellPresent;

  const makeClassList = (classes = new Set()) => ({
    add(value) { classes.add(value); },
    remove(value) { classes.delete(value); },
    contains(value) { return classes.has(value); },
    toggle(value, enabled) {
      if (enabled) classes.add(value);
      else classes.delete(value);
    },
  });

  const root = {
    classList: makeClassList(rootClasses),
    dataset: {},
    style: {
      setProperty(key, value) { rootStyles.set(key, value); },
      removeProperty(key) { rootStyles.delete(key); },
    },
    appendChild(node) {
      node.parentElement = root;
      nodes.set(node.id, node);
    },
    setAttribute(name, value) {
      if (name === "data-dream-text-side") this.dataset.dreamTextSide = value;
      if (name === "data-dream-decoration") this.dataset.dreamDecoration = value;
      if (name === "data-dream-polaroid") this.dataset.dreamPolaroid = value;
      if (name === "data-dream-motif") this.dataset.dreamMotif = value;
      if (name === "data-dream-emblem") this.dataset.dreamEmblem = value;
      if (name === "data-dream-theme") this.dataset.dreamTheme = value;
    },
    removeAttribute(name) {
      if (name === "data-dream-text-side") delete this.dataset.dreamTextSide;
      if (name === "data-dream-decoration") delete this.dataset.dreamDecoration;
      if (name === "data-dream-polaroid") delete this.dataset.dreamPolaroid;
      if (name === "data-dream-motif") delete this.dataset.dreamMotif;
      if (name === "data-dream-emblem") delete this.dataset.dreamEmblem;
      if (name === "data-dream-theme") delete this.dataset.dreamTheme;
    },
  };
  const body = {
    appendChild(node) {
      node.parentElement = body;
      nodes.set(node.id, node);
    },
  };
  const shellMainClasses = new Set();
  const shellMain = {
    classList: makeClassList(shellMainClasses),
    getBoundingClientRect() {
      return { left: 290, top: 36, width: 990, height: 784 };
    },
  };
  const staleHome = { classList: makeClassList(new Set(["dream-home"])) };
  const staleShell = { classList: makeClassList(new Set(["dream-home-shell"])) };
  const newTaskButton = {
    textContent: "新建任务Ctrl+N",
    classList: makeClassList(newTaskClasses),
  };

  const createElement = () => ({
    id: "",
    dataset: {},
    style: {},
    classList: makeClassList(),
    parentElement: null,
    textContent: "",
    innerHTML: "",
    setAttribute() {},
    remove() { nodes.delete(this.id); },
  });
  if (staleSkin) {
    const style = createElement();
    style.id = "codex-dream-skin-style";
    nodes.set(style.id, style);
    const chrome = createElement();
    chrome.id = "codex-dream-skin-chrome";
    nodes.set(chrome.id, chrome);
  }

  const document = {
    documentElement: root,
    head: root,
    body,
    createElement,
    getElementById(id) { return nodes.get(id) ?? null; },
    querySelector(selector) {
      if (selector === "main.main-surface") return hasShell ? shellMain : null;
      if (selector === "aside.app-shell-left-panel") return hasShell ? {} : null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "aside.app-shell-left-panel button") return [newTaskButton];
      if (selector === ".dream-new-task") return newTaskClasses.has("dream-new-task") ? [newTaskButton] : [];
      if (selector === ".dream-action-shell") {
        return [
          ...(shellMainClasses.has("dream-action-shell") ? [shellMain] : []),
          ...[...nodes.values()].filter((node) => node.classList?.contains?.("dream-action-shell")),
        ];
      }
      if (!staleSkin) return [];
      if (selector === ".dream-home") return [staleHome];
      if (selector === ".dream-home-shell") return [staleShell];
      return [];
    },
  };
  const context = {
    window: {},
    document,
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    URL: {
      createObjectURL() { return "blob:fixture"; },
      revokeObjectURL(value) { revokedUrls.push(value); },
    },
    Blob,
    Uint8Array,
    atob,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 2,
    clearTimeout: () => {},
  };

  return {
    context,
    nodes,
    rootClasses,
    rootStyles,
    newTaskClasses,
    shellMainClasses,
    revokedUrls,
    setShellPresent(value) { hasShell = value; },
  };
}

const main = createFixture({ shellPresent: true });
const mainResult = vm.runInNewContext(payload, main.context);
assert.equal(mainResult.installed, true);
assert.equal(mainResult.themeId, "fixture-theme");
assert.equal(main.rootClasses.has("codex-dream-skin"), true);
assert.equal(main.rootStyles.get("--dream-art"), 'url("blob:fixture")');
assert.equal(main.rootStyles.get("--dream-tagline"), '"Theme tagline"');
assert.equal(main.rootStyles.get("--dream-focal-x"), "31%");
assert.equal(main.rootStyles.get("--dream-accent-glyph"), '"✦"');
assert.equal(main.context.document.documentElement.dataset.dreamDecoration, "geometric");
assert.equal(main.context.document.documentElement.dataset.dreamMotif, "floral");
assert.equal(main.context.document.documentElement.dataset.dreamEmblem, "wing");
assert.equal(main.context.document.documentElement.dataset.dreamTheme, "fixture-theme");
assert.equal(main.newTaskClasses.has("dream-new-task"), true);
assert.equal(main.nodes.has("codex-dream-skin-style"), true);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), true);
assert.equal(main.nodes.get("codex-dream-skin-chrome").dataset.dreamSchema, "3");
main.context.window.__CODEX_DREAM_SKIN_STATE__.dismissHome();
main.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(main.shellMainClasses.has("dream-action-shell"), true);
assert.equal(main.nodes.get("codex-dream-skin-chrome").classList.contains("dream-action-shell"), true);
assert.equal(main.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(main.rootClasses.has("codex-dream-skin"), false);
assert.equal(main.rootStyles.has("--dream-tagline"), false);
assert.equal(main.rootStyles.has("--dream-accent-glyph"), false);
assert.equal(main.context.document.documentElement.dataset.dreamDecoration, undefined);
assert.equal(main.context.document.documentElement.dataset.dreamMotif, undefined);
assert.equal(main.context.document.documentElement.dataset.dreamEmblem, undefined);
assert.equal(main.context.document.documentElement.dataset.dreamTheme, undefined);
assert.equal(main.newTaskClasses.has("dream-new-task"), false);
assert.equal(main.nodes.has("codex-dream-skin-style"), false);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), false);
assert.equal(main.shellMainClasses.has("dream-action-shell"), false);
assert.deepEqual(main.revokedUrls, ["blob:fixture"]);

const auxiliary = createFixture({ shellPresent: false, staleSkin: true });
const auxiliaryResult = vm.runInNewContext(payload, auxiliary.context);
assert.equal(auxiliaryResult.installed, true);
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), false);
assert.equal(auxiliary.rootStyles.has("--dream-art"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), false);

auxiliary.setShellPresent(true);
auxiliary.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), true);

const legacyChrome = createFixture({ shellPresent: true, staleSkin: true });
const legacyResult = vm.runInNewContext(payload, legacyChrome.context);
assert.equal(legacyResult.installed, true);
assert.equal(legacyChrome.nodes.get("codex-dream-skin-chrome").dataset.dreamSchema, "3");

console.log("PASS: renderer themes the Codex shell and preserves transparent auxiliary windows.");
