# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 前提条件

- **回答は日本語で行ってください。**
- 全てのファイルはUTF-8で保存されています。
- 本プロジェクトは日本語で開発されています。

## What This Project Is

**Simutrans Coupling Monster** — a browser-based web application that helps create and edit vehicle addons for the free transport simulation game Simutrans. The core feature is managing coupling (連結) constraints between vehicles, with additional support for image assignment, Japanese localization (ja.tab), and cost calculation (Pak128Japan).

The app runs entirely client-side with no server communication. All data lives in-memory during the session.

## Running the App

Open `index.html` directly in a browser (Chrome recommended). There is no build step, no package manager, and no framework — it is plain HTML, CSS, and vanilla JavaScript.

## Architecture

### Global State (js/constants.js)

All mutable state is module-global, declared in `constants.js`:

- `masterAddons` — array of addon objects. Each addon is a plain JS object where dat file properties become object keys (e.g. `addon.speed`, `addon.waytype`). The special key `constraint` holds `{ prev: Set<addon>, next: Set<addon> }` (addon object references, not names).
- `imageFileNames` — `Set<string>` of image filenames referenced by any loaded dat.
- `imageFiles` — `Map<filename, HTMLImageElement>` for loaded PNG files.
- `jatab` — `Map<addon, string>` mapping addon objects to their Japanese names.
- `masterDatFileName` — string name of the loaded dat file.

### Core Logic (js/main.js)

Handles all file I/O and data manipulation:
- `loadDatFile(file)` — parses `.dat` format, populates `masterAddons`. Coupling constraints are initially stored as name strings, then converted to object references via `convertConstraintsToObject()` after all addons are loaded.
- `writeDat()` / `writeJaTab()` — serialize `masterAddons` / `jatab` back to file format.
- `addCarToMaster()`, `deleteCarFromMasterById()` — CRUD on `masterAddons`.

The dat format uses `---` as a separator between vehicles. Properties are `key=value` lines. Constraint entries look like `constraint[prev][0]=vehicle_name`.

Image positions in dat: `emptyimage[s]=filename.row.col` (direction, y-position, x-position within the spritesheet).

### Vehicle Reversal Images (Image for Reversing / OTRP)

Supports Simutrans OTRP's reversal images (`FreightImage[1]`). Spec: [Wiki](https://github.com/teamhimeh/simutrans/wiki/編成反転時用画像について-Image-for-Reversing)

**Data model (important):**
- The only reverse data stored on an addon is the `freightimage[1][dir]` properties (the editable core data). `REVERSE_FREIGHTIMAGE_DIRECTIONS` (`constants.js`) is the array of all 8 direction keys.
- "Has reverse images" = at least one `freightimage[1][dir]` property exists.
- `freightimagetype[0]/[1]` and `freightimage[0][dir]` are **auto-generated on save (`writeDat`)** (`freightimage[0][dir] = emptyimage[dir]`, `freightimagetype[1]=Reverse`, `freightimagetype[0]=addon.freight ?? "Passagiere"`). Because the spec forbids having both loaded-cargo images and reverse images, the forward image must equal the empty-car image; generating it on save keeps it consistent even after EmptyImage is edited.
- On load (`loadDatFile`), `freightimage[0]` / `freightimagetype[0]` / `freightimagetype[1]` are not persisted (discarded, since they are regenerated). `index>=2` (v52+ `No_Electric` / `Reverse_No_Electric`) is not editable but is preserved as raw properties and re-emitted to keep round-trips lossless.
- `writeDat` skips `freightimage*` / `freightimagetype*` in its generic loop; `generateReverseImageDat(addon)` produces the dedicated block.

**Display helpers (`main.js`):**
- `getReverseDisplayImageKey(addon)` — returns the reverse-image key if present, otherwise the normal image key (s direction).
- `getFormationImageData(addon, useReverse)` — returns image data `[name, y, x]` for formation rendering.
- Because the reverse image itself already depicts the reversed appearance, previews/screenshots **keep the vehicle order and only swap to reverse images** (reversing the order would double-reverse it).

**UI:**
- The image-assignment dialog (`editImageDialog`) has a "normal / reverse" radio toggle. `editingImageType` (`"empty"`/`"reverse"`) and `getEditingImageKey(dir)` branch by mode.
- The coupling preview (`couplingPreviewDialog`) and formation screenshot (`formatedAddonsImageDialog`) have a reverse toggle; the screenshot inherits the coupling preview's toggle state.

### Dialog System (js/dialog.js)

`Dialog` is a class that manages all modal UI. Key patterns:
- `new Dialog(id, title, htmlContent, buttons[], functions{}, isOverlay)` — registers the dialog in `Dialog.list[id]`.
- `isOverlay=true` means the dialog layers on top of others; `false` means it replaces the current dialog.
- All dialogs are instantiated inside the `window load` listener in `defineDialogs.js` and `defineGeneralDialogs.js`.
- Access any dialog via `Dialog.list.dialogId.functions.display()` / `.on()` / `.off()`.

General-purpose dialogs (alert, confirm, info) are in `defineGeneralDialogs.js`. Feature-specific dialogs (addCar, couplingPreview, calcCost, formationTemplate, etc.) are in `defineDialogs.js`.

### UI / Rendering (js/ui.js)

`refresh()` is the single function that re-renders the entire main view from current `masterAddons` state. It is called after any mutation. The main view shows:
- The currently-selected addon's image (from `carsSelectBox` select element)
- Its editable properties table
- The `constraint[prev]` and `constraint[next]` panels with drag-and-drop support

Vehicle images are rendered as CSS `background-position` crops from a spritesheet. `PAK_TYPE = 128` is the tile size in pixels.

### Drag and Drop (js/drag.js)

`Drag.setElements(draggables, dropTargets, callback)` wires up drag-and-drop. Used for:
1. Dragging vehicles from the footer list into the constraint-prev / constraint-next panels
2. Dragging from constraint panels back to the footer list to remove a constraint

### Utility Modules

- `js/utils/table.js` — `Table` class for building HTML tables programmatically.
- `js/utils/tableSort.js` — `TableSort` adds sort buttons to tables.
- `js/utils/suggestion.js` — `setSuggestionBox(input, box, dataset)` attaches autocomplete dropdowns.
- `js/utils/balloon.js` — tooltip/balloon overlay via `setBalloon(element, message)`.
- `js/utils/dropdown.js` — hover dropdown menus (`.mku-drop-menu-container`).
- `js/utils/tab.js` — tabbed content (`.mku-tab-container`).
- `js/natsort/natsort.js` — natural sort for table columns.
- `js/observe.js` — `setObservedArray()` / `setObservedInstance()` wrap objects in Proxy to fire callbacks on mutation.
- `js/message.js` — `Message` class for toast notifications.
- `js/costPak128Japan.js` — cost calculation formulas specific to Pak128Japan ruleset.
- `js/keyboard.js` — keyboard shortcut handling.
- `js/fluctuation.js` — select box size auto-adjustment.
- `js/contextMenu.js` — right-click context menu.

### CSS Structure

- `css/general.css`, `css/main.css` — base layout
- `css/dialog.css` — dialog shell styles
- `css/dialogs/*.css` — per-dialog styles
- `css/utils/*.css` — utility component styles matching their JS counterparts
- `ligatureSymbols/` — icon font used for button icons via `icon="..."` attribute + `.lsf-icon` class

## Key Conventions

- `gebi` is a shorthand alias for `document.getElementById` (defined in `constants.js`).
- Addon properties protected from user editing (excluded from the prop table, the add-property dialog, and copy targets): `name`, `obj`, `constraint`, `emptyimage[*]`, and `freightimage[*]` / `freightimagetype[*]` (reverse images are managed by their dedicated UI).
- The `EMPTYIMAGE_DIRECTIONS` array (`emptyimage[s]`, `emptyimage[e]`, etc.) covers 8 compass directions. `REVERSE_FREIGHTIMAGE_DIRECTIONS` is the equivalent for reverse images (`freightimage[1][s]`, ...). Use `getFreightImageKey(typeIndex, dir)` to build a key.
- `ADDON_NONE = { name: "none" }` is a sentinel object for "no coupling allowed" constraints.
- Image transparency key color is RGB `(231, 255, 255)` — pixels of this color are made transparent during formation screenshot rendering.
- Reverse images (`FreightImage[1]`) are for the OTRP vehicle-reversal feature. See the "Vehicle Reversal Images" subsection under Architecture for details.
