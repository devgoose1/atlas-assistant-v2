---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

PROJECT CONTEXT FOR GITHUB COPILOT:

This project is a desktop-based JARVIS-style personal assistant.
It is NOT a website. It runs as a local desktop application on the user's laptop.

CORE GOAL:
Create a futuristic, Iron Man–style JARVIS interface with a reactive animated UI,
voice interaction, system awareness, and a modular assistant architecture.
The assistant should work offline-first, with optional online enhancements.

--------------------------------
TECH STACK OVERVIEW
--------------------------------

Frontend (UI):
- React (Javascript)
- Runs inside a desktop shell (Tauri preferred, Electron acceptable)
- No traditional website routing
- Fullscreen / overlay style UI
- Dark, futuristic, neon-blue theme
- Heavy use of animations, glow effects, and circular layouts

Backend (Logic / Brain):
- Python (local process)
- Handles:
  - Speech recognition
  - Assistant logic & reasoning
  - System information (CPU, RAM, network)
  - Task execution
  - Offline models
- Communicates with frontend via:
  - WebSockets OR
  - Tauri native command bridge

--------------------------------
ARCHITECTURE PRINCIPLES
--------------------------------

- Frontend and backend are strictly separated
- UI does NOT contain assistant logic
- Backend does NOT care about visuals
- Everything must work offline by default
- Online services are optional enhancements, not requirements
- Modular, expandable system design

--------------------------------
APPLICATION STATES (VERY IMPORTANT)
--------------------------------

The assistant operates as a state machine:

- IDLE
  Default resting state, subtle animations, passive UI

- LISTENING
  Microphone active, visual pulse/reactive ring

- THINKING
  Backend processing input, UI shows loading / analysis animation

- RESPONDING
  Assistant is speaking or showing output

- ERROR
  Graceful fallback, never hard crash UI

UI animations and behavior depend on the current assistant state.

--------------------------------
UI STRUCTURE (COMPONENT-BASED)
--------------------------------

The UI is built from modular React components:

- App (root)
- BackgroundLayer
  - Starfield / particles / subtle motion
- CenterOrb
  - Main circular core
  - Microphone button
  - Pulse animation
- ModuleRing
  - Circular layout of assistant modules/icons
- StatusPanel (top-right)
  - Time
  - CPU usage
  - Memory usage
  - Network status
- VoiceFeedback
  - Transcription text
  - Assistant response text

All UI elements should be animated, soft-glowing, and non-intrusive.

--------------------------------
VISUAL STYLE GUIDELINES
--------------------------------

- Dark background (space-like)
- Neon blue / cyan highlights
- Glow effects via CSS box-shadow
- Smooth transitions (no hard edges)
- Circular geometry preferred over rectangles
- Minimal text, icon-driven UI

--------------------------------
VOICE & INTERACTION
--------------------------------

- Push-to-talk or hotkey-based voice input
- Microphone audio level should visually affect UI
- Speech-to-text handled by Python backend
- Frontend only visualizes listening state

--------------------------------
OFFLINE / ONLINE BEHAVIOR
--------------------------------

Offline mode:
- Local speech recognition
- Local assistant logic
- Local memory (SQLite / JSON)
- Full system control

Online mode (optional):
- Cloud LLM
- External APIs
- Sync features

The app should automatically fall back to offline when no internet is available.

--------------------------------
DATA & MEMORY
--------------------------------

- Local persistent memory only
- User-controllable memory (clear, inspect)
- No hidden data storage
- SQLite for structured data
- JSON for UI settings and state

--------------------------------
SYSTEM INTEGRATION
--------------------------------

The assistant can:
- Read system stats (CPU, RAM, network)
- Launch applications
- Read/write files (with permission)
- Run local commands safely

--------------------------------
CODING EXPECTATIONS FOR COPILOT
--------------------------------

When generating code:
- Prefer modular, readable components (So every module is a seperate file!)
- Avoid overengineering
- Favor clarity over cleverness
- Keep logic separated from UI
- Write expandable systems, not one-offs
- Assume future features will be added

DO NOT:
- Treat this as a website
- Add unnecessary routing
- Add cloud dependencies by default
- Mix assistant logic into React UI

This project aims to feel like a real operating system assistant,
not a chat app or dashboard.