# Requirements

## Overview
High-level overview of the Money project requirements.

## Functional Requirements

### 1. Transaction Tracker (The Core)
**Philosophy**: "Manual First, but Assisted". The user must confirm the spending (to feel the pain of paying), but the app should remove all friction to getting there.

**Target User Scenario**: 45yo user, needs reading glasses (presbyopia), often in a rush (carrying groceries, in the car), frequent repeat locations (Walmart, Drive-thru).

#### 1.1 The "No Glasses" Interface
- **Giant Keypad**: The default home screen is a large numeric keypad. No small text fields.
- **High Contrast**: White text on dark background by default.
- **Haptic Feedback**: Vibration on keypress to confirm input without looking.
- **Audio Confirmations**: Distinct sound for successful save.

#### 1.2 The "Smart Context Engine" (The Agent)
The app should act as an agent that attempts to guess the user's intent based on available signals.
- **Inputs**:
    - **GPS Location**: Detects if user is at a known merchant (e.g., McDonald's, Walmart).
    - **Time of Day/Day of Week**: Learns patterns (e.g., Coffee every morning at 8 AM).
    - **History**: Learn from past manual entries.
- **Behavior**:
    - **High Confidence**: If the app is >60% sure, it pre-fills the Merchant and Category. The prompts changes to: "At [Merchant]?". User only types Amount.
    - **Medium Confidence**: Presents "Quick Action" bubbles for the top 3 likely categories/merchants above the keypad.

#### 1.3 Addressing Core Constraints (UX Solutions)
1.  **Network / Connectivity ("Offline-First")**
    -   **Problem**: Poor signal in big box stores.
    -   **Solution**: Optimistic UI. Transactions save locally instantly. Background sync when online. "Smart Context" uses cached "frequent zones" or last known location.

2.  **Hand Occupied ("The Thumb Zone")**
    -   **Problem**: One-handed use while carrying bags.
    -   **Solution**: "Bottom-Sheet" Layout.
        -   Keypad anchored to bottom.
        -   Display in middle screen (not top).
        -   Category drawer slides up from bottom (most used at bottom).
        -   **Gestures**: Swipe Down on keypad to Save; Swipe Left to Delete.

3.  **Split Transactions ("The Complexity")**
    -   **Problem**: $75 receipt ($45 Food, $20 Clothing). Too complex to split while walking.
    -   **Solution**: "The Quick-Snap Flag".
        -   User enters Total ($75) and dominant category.
        -   **Long Press** Save button to "Flag for Review".
        -   User splits the transaction later at home. captures total spend immediately.

4.  **Social Friction ("The Rude/Rush Factor")**
    -   **Problem**: Awkward to tap phone at checkout.
    -   **Solution**: "Stealth Mode".
        -   Lock-screen widget or notification quick-action (if platform allows).
        -   One tap to open keyboard overlay -> Type Amount -> Done.

5.  **Mental Fatigue ("The Decision")**
    -   **Problem**: "Which category is this?" causes hesitation.
    -   **Solution**: "Broad Buckets".
        -   Limit Mobile View to ~8 high-level categories (e.g., Food, Housing, Auto).
        -   Detail added via Tags or Merchant Name inference later.

#### 1.4 Use Cases & Screen Mapping
**1. The "Walmart Dash" (One-Handed / Panic)**
-   **Context**: Walking out of store, handling bags, phone in one hand.
-   **Screen**: **Mode C (The Dual Arc)**.
-   **Action**: User thumb-types Amount -> Locks Phone (or swipes home).
-   **System**: Implicit Save. Infers context.
-   **Next Step**: Triggers **Screen 2 (The Toast)** on next unlock.

**2. The "Traffic Light" (Quick Review)**
-   **Context**: User unlocks phone in car or walking away.
-   **Screen**: **Screen 2 (The Toast)**.
-   **Action**: Notification asks: "Was that $75 at Walmart?" -> Tap "Yes".
-   **System**: Marks transaction as Complete.

**3. The "Coffee Sit-Down" (Two-Handed / Detailed)**
-   **Context**: User has time and both hands available.
-   **Screen**: **Mode A (Full Grid)**.
-   **Action**: User taps "Maximize" on panic screen -> Interface expands.
-   **System**: Allows full categorization, tagging, notes, and splits before saving.

**4. The "Evening Cleanup" (Deep Review)**
-   **Context**: End of day/week review on Desktop or Tablet.
-   **Screen**: **Screen 3 (Review Queue)**.
-   **Action**: User processes all "Amount Only" or "Flagged" transactions.
-   **System**: Learns from these manual corrections to improve future predictions.

#### 1.5 The Review Queue (Inbox Zero for Money)
- **Concept**: A dedicated view (likely Desktop/Web or "Evening Mode" on mobile) to process incomplete data.
- **Function**:
    -   Shows all "Flagged" or "Amount Only" transactions.
    -   User confirms Agent guesses or manually categorizes/splits.
    -   **Goal**: Ensure the user never feels blocked in the moment, knowing they can "fix it later".

### 2. UI Wireframes (Concept)

**Mode A: Two-Handed / Default (Full Width)**
*(Best for situations where you have full attention)*
```text
+-----------------------+
|  [Status: Safe]       |
|      $ 4 5 . 0 0      |
+-----------------------+
| (Groceries) (Dining)  | <--- Full width Row
+---+---+---+-----------+
| 1 | 2 | 3 |  DELETE   |
+---+---+---+-----------+
| 4 | 5 | 6 |           |
+---+---+---+   SAVE    |
| 7 | 8 | 9 |           |
+---+---+---+-----------+
| . | 0 | + |  SPLIT    |
+---+---+---+-----------+
```

**Mode B: "True Thumb" Mode (Right-Handed Setting)**
*(Best for walking/carrying bags. Everything hugs the bottom-right corner)*
```text
+-----------------------+
|      $ 4 5 . 0 0      | <--- Still Visible
+-----------------------+
|          (Groceries)  | <--- Suggestions stacked Vertically
|             (Dining)  |      (Easier to hit with thumb arc)
+-------+---+---+-------+
|       | 1 | 2 | 3 | D |
|       +---+---+---| E |
| Dead  | 4 | 5 | 6 | L | <--- Keypad shrunk to 75% width
| Zone  +---+---+---|   |      & Docked to Right
|       | 7 | 8 | 9 | S |
|       +---+---+---| A |
|       | . | 0 | + | V | <--- Main Action in prime spot
+-------+---+---+---+---+
```

**Mode C: The "Dual Arc" (Radial Layout)**
*(Keys organized into two concentric semicircles to keep everything in the Green Zone)*
```text
           (Groceries)
        (Dining)
     (Gas)

      (Outer Arc: Reach)
     [ 4 ] [ 5 ] [ 6 ] [ 7 ] [ 8 ] [ 9 ]

      (Inner Arc: Comfort)
       [ 1 ] [ 2 ] [ 3 ] [ 0 ] [ . ]
       
                    (SAVE)      <--- Thumb Pivot
```
*Note: This flattens the vertical reach. The thumb only needs to toggle between two extremely close "rows" (arcs), sweeping left-to-right rather than reaching up-and-down.*

**Screen 2: The "Toast" (Immediate Review - Walking to Car)**
```text
+-----------------------+
|                       |
|      ( User lives     |
|       their life )    |
|                       |
| [ Saved at Walmart  ] |
| [ Category: Food?   ] | <--- Non-intrusive Toast
| [ CONFIRM | ABORT   ] |
+-----------------------+
```

**Screen 3: The Review Queue (Desktop/Evening)**
```text
+-----------------------------------+
|  REVIEW QUEUE (2 pending)         |
+-----------------------------------+
| [!] $75.00 @ Walmart              | <--- Flagged
|     (Inferred: Groceries)         |
|     [ Confirm ] [ Split ] [ Edit ]|
+-----------------------------------+
| [?] $12.50 @ Unknown              | <--- Amount Only
|     [ Category? ]                 |
+-----------------------------------+
```

## Non-Functional Requirements
- **Mobile First**: PWA or Native-feel mobile web app.
- **Speed**: Cold start to "Entry Ready" in < 1 second.
