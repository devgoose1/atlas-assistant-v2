# ATLAS Assistant v2

Een desktop-gebaseerde JARVIS-achtige persoonlijke assistent met een geavanceerde, geanimeede UI.

Dit project is **NIET** een website, maar een lokale desktop applicatie die op je laptop draait als een **Tauri Desktop App**.

## 🚀 Quick Start

### Vereisten

- **Rust** (voor Tauri): [https://rustup.rs/](https://rustup.rs/)
- **Node.js** (v18+): [https://nodejs.org/](https://nodejs.org/)
- **Python** (3.9+)

### Installatie & Eerste Run

1. **Clone de repository**

   ```bash
   git clone <your-repo>
   cd atlas-assistant-v2
   ```

2. **Installeer frontend dependencies**

   ```bash
   cd frontend
   npm install
   ```

3. **Installeer Python dependencies**

   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Start de desktop app**

   Vanuit de root directory:

   ```powershell
   .\start-desktop.ps1
   ```

   Of manueel:
   - Terminal 1: `cd backend/src && python main.py`
   - Terminal 2: `cd frontend && npm run tauri:dev`

### Build voor Productie

```bash
cd frontend
npm run tauri:build
```

De desktop installer wordt gegenereerd in `frontend/src-tauri/target/release/bundle/`

## Tech Stack Overview

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

## Architecture Principles

- Frontend and backend are strictly separated
- UI does NOT contain assistant logic
- Backend does NOT care about visuals
- Everything must work offline by default
- Online services are optional enhancements, not requirements
- Modular, expandable system design

## Application States (Very Important)

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

## UI Structure (Component-Based)

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

## Visual Style Guidelines

- Glow effects via CSS box-shadow
- Smooth transitions (no hard edges)
- Circular geometry preferred over rectangles
- Minimal text, icon-driven UI

--------------------------------

VOICE & INTERACTION

## Voice & Interactionvisually affect UI

- Speech-to-text handled by Python backend
- Frontend only visualizes listening state

--------------------------------

OFFLINE / ONLINE BEHAVIOR

## Offline / Online Behavior

- Local speech recognition
- Local assistant logic
- Local memory (SQLite / JSON)
- Full system control

Online mode (optional):

- Cloud LLM
- External APIs
- Sync features

The app should automatically fall back to offline when no internet is available.

## DATA & MEMORY

- Local persistent memory only

## Data & Memory

## SYSTEM INTEGRATION

The assistant can:

## System Integrationion)

- Run local commands safely

## CODING EXPECTATIONS FOR COPILOT

When generating code:

## Coding Expectations for Copilot

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
