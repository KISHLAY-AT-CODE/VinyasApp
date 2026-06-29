# Changelog

All notable changes to the **Vinyas Sathi** companion client project will be documented in this file.

---

## [1.0.0] - 2026-06-29

### Added
- **Textbook Module Mapping**: Integrated a persistent selection picker bottom sheet overlay dialog for mapping syllabus books per subject locally.
- **Floating 3D Loader Overlay**: Created a premium, responsive React Native animation screen displaying SVG waves, a floating Vinyas logo backdrop, a glowing orange stick-man surfer tilted at `-10deg` with bobbing dynamics, and a terminal console readout.
- **Developer Playground Instrumentation**: Built a test panel containing a network event console logger and a 3-second simulation loader trigger.
- **Tap Sequence Security Lock**: Protected the developer playground behind a secret tap sequence (1x Client Version, 2x Local Cache, 3x Developer Maintainer) with strict sequence order and tap count validations.
- **Hide Console Toggle**: Implemented a "Hide" button next to the playground section header that locks the playground and resets tap sequences.
- **Over-the-Air (OTA) Updates Integration Setup**: Created configurations for Expo EAS Updates.

### Fixed
- **Tab Swiping Jitter**: Fixed the active-tab programmatic feedback scroll cycle inside `ScrollView` by introducing state tracking flags (`isProgrammaticScrollRef`).
- **Styles Union Typing Conflicts**: Declared component stylesheets as `any` to prevent React Native typing conflicts.
- **V Logo Overlay & Padding**: Adjusted spacing parameters (`marginBottom: 50` and absolute depth values) to prevent the V logo shadow from overlapping and hiding the surfer graphic.
- **Logs Console Formatting**: Removed leading CLI console symbols (`$`) and formatted actions into readable command chains.
- **Asset Branding**: Renamed app configuration profile to "Vinyas Sathi" and set custom icon paths (`icon.png`).
