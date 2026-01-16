# My Money 💰

A hyper-fast, local-first Personal Finance PWA designed for mobile capture and "Safe-to-Spend" budgeting.

## 🚀 Features

*   **Lightning Capture**: optimized flow to enter transactions in seconds.
*   **Safe-to-Spend**: Real-time calculation of remaining budget based on Income - Spend.
*   **Context Aware**: Auto-remembers Merchant details (Category, Account).
*   **Flexible Tagging**:
    *   **Standard Tags**: `#Coffee`, `#Work`
    *   **Time-Based Events**: `#Trip-Hawaii` (Active only during the trip dates).
    *   **Seasonal Tasks**: `#Taxes2025` (Active during tax season for easy filing).
*   **Local First**: All data stored in your browser (IndexedDB). No servers, no tracking.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite)
*   **Database**: Dexie.js (IndexedDB wrapper)
*   **Styling**: Pure CSS (Variables, Dark/Light modes supported)
*   **Deployment**: Static Web App (Vercel/Netlify compatible)

## 📂 Project Structure

*   `src/HomeView.jsx` - Dashboard & Reporting
*   `src/CaptureView.jsx` - Transaction Entry & Tagging
*   `src/ManageView.jsx` - Entity Management (CRUD)
*   `src/db.js` - Database Schema & Seeding

## 🏷️ Tagging System (v1.99+)

The app features a robust dual-mode tagging system:
1.  **Permanent Tags**: Always available in the list.
2.  **Temporary Tags**: Defined by a Start/End date.
    *   *Auto-Sort*: Automatically appear at the top of the list during their active window.
    *   *Auto-Hide*: Disappear from the selection list when expired (but keep data).

## 🏃‍♂️ Running Locally

```bash
npm install
npm run dev
```
open `http://localhost:5173`
