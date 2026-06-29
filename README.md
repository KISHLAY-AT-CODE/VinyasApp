# Vinyas Sathi (Mobile Companion)

Vinyas Sathi is the native mobile companion application for the **Vinyas Gamified Syllabus Tracker**. Built with Expo, React Native, and TypeScript, it provides a premium, responsive dashboard for students to track learning metrics, manage study plans, and view syllabus milestones on the go.

---

## Key Features

- **Real-Time Account Syncing**: Instant connection with the Vinyas web planner console via Sync ID entry or QR code scanning.
- **Offline-First Cache**: Local AsyncStorage persistence layer that caches syllabus profiles, chapter details, and learning stats for offline access.
- **Premium Wave-Surf Loader**: A 3D animated loading overlay featuring a vector stick-man surfer riding floating waves in sync with network logging telemetry.
- **Textbook Picker Bottom Sheet**: Integrated persistent picker modal that allows users to map and link chapters to specific syllabus textbook URLs.
- **Developer & Maintainer Playground**: A secure, Konami-style hidden instrumentation deck (unlocked by tapping info rows) hosting a scrollable console and simulator controls.
- **Zero-Jitter Navigation**: Custom swipe ViewPager gesture navigation optimized to eliminate loop-scroll feedback jitter.

---

## Tech Stack

- **Framework**: Expo (React Native SDK 56)
- **State Management**: React Query (TanStack Query)
- **Data Persistence**: React Native AsyncStorage
- **Components & Vector Graphics**: Expo Image, React Native SVG
- **Type Safety**: TypeScript 6.0

---

## Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and the Expo CLI installed.

### 2. Installation
Install project dependencies in the project root:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of the `VinyasApp` folder and configure your API targets:
```env
# Environment variables exposed to the JS bundle must start with EXPO_PUBLIC_
EXPO_PUBLIC_FETCH_URL=http://localhost:3000/
EXPO_PUBLIC_IP_TEST=http://192.168.x.x:3000/
EXPO_PRODUCTION=https://vinyas-one.vercel.app/
```

### 4. Running the App
Start the Metro bundler and open the app on your preferred platform:

- **Android Client**:
  ```bash
  npm run android
  ```
- **iOS Client**:
  ```bash
  npm run ios
  ```
- **Web App Emulator**:
  ```bash
  npm run web
  ```

---

## Project Structure

```
VinyasApp/
├── assets/                  # Icons, fonts, and brand assets
├── src/
│   ├── app/                 # Expo Router page entrypoints
│   ├── components/
│   │   └── vinyas/          # Shared views (Syllabus, Analytics, Settings, Onboarding)
│   └── constants/           # Global theme, translations, and calculations
├── app.json                 # Expo native configuration bundle
└── package.json             # NPM dependencies and runtime scripts
```

---

## License
Distributed under the ISC License. See `LICENSE` for more information.
