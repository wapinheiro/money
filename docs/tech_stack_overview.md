# Mobile Development Tech Stack Overview


## The Three Paths

### 1. Native (The "Old School" Way)
*   **Tech**: Swift (iOS) and Kotlin (Android).
*   **Pros**: Best possible performance, full access to hardware (haptics, complex sensors).
*   **Cons**: You have to write the code **twice**. Two codebases, two languages to learn. Slower development.
*   **Verdict**: Overkill for V1.

### 2. Cross-Platform Native (React Native / Flutter)
*   **Tech**: JavaScript/React (React Native) or Dart (Flutter).
*   **Pros**: Write once, run on both. Renders simpler "native" views. Good performance.
*   **Cons**: Complexity. You still deal with "Builds" (Xcode/Android Studio), waiting for review times to deploy updates.
*   **Verdict**: Good for V2, but maybe too slow for a fast POC.

### 3. Progressive Web App (PWA) -> The "Money" Choice
*   **Tech**: HTML, CSS, JavaScript (React + Vite). **This is what we built for the POC.**
*   **Concept**: It's a website that *thinks* it's an app.
    *   **Installable**: You visit the URL, tap "Add to Home Screen", and it gets its own icon.
    *   **Offline First**: We use a "Service Worker" to cache files so it opens instantly, even in a Walmart bunker.
    *   **Full Screen**: It hides the browser URL bar.
*   **Pros**: 
    *   **Speed**: You change code, deploy, and users get it instantly (no App Store review).
    *   **One Codebase**: Runs on Desktop, iPhone, Pixel.
*   **Cons**: Slightly limited access to very deep hardware (though Haptics and Camera *do* work on PWAs now!).

## The Recommended Stack for "Money" (Project Money)

We are currently building a **PWA**. Here is the specific stack:

1.  **Framework: React**
    *   The industry standard for building user interfaces. It lets us build "Components" (like your `KeypadArc` or `ToastNotification`) and reuse them.

2.  **Build Tool: Vite**
    *   Replaces heavier tools like Webpack. It's instant. When you save a file, the app updates in milliseconds.

3.  **Database: LocalStorage / IndexedDB (Dexie.js)**
    *   **Crucial for Offline**. We don't save to a server first. We save to the phone's tiny hard drive (IndexedDB). This guarantees the "Panic Mode" always saves, even with 0 bars of signal. We sync to the cloud later.

4.  **Styling: CSS Modules / Tailwind**
    *   **CSS Modules**: Keeps styles local to components so they don't break each other.
    *   **Tailwind**: Utility-first CSS for rapid UI development.

## How we "Phone-ify" it later (Capacitor)

If later we decide we *need* to be in the App Store, we don't have to rewrite code. We use a tool called **Capacitor**.
*   **What it does**: Takes our build PWA folder and wraps it in a "Native Shell".
*   **Result**: We get a real `.ipa` (iOS) and `.apk` (Android) file to upload to stores, but the inside is still our React code.

## Summary
For "Money", we stay with **React + Vite (PWA)**. It allows us to iterate on the specific UX (the Radial Keypad) instantly without waiting for compile times.
