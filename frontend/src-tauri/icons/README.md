# Icon Setup

Tauri heeft icons nodig voor de desktop app. Je hebt twee opties:

## Optie 1: Automatisch genereren (Aanbevolen)

Gebruik de Tauri icon generator:

```bash
cd frontend
npm install @tauri-apps/cli@latest
npx @tauri-apps/cli icon path/to/your/icon.png
```

Dit genereert automatisch alle benodigde icon formaten.

## Optie 2: Manueel plaatsen

Plaats de volgende bestanden in `src-tauri/icons/`:

- **icon.ico** - Windows icon (256x256 of hoger)
- **icon.icns** - macOS icon
- **32x32.png** - Linux icon
- **128x128.png** - Linux icon
- **128x128@2x.png** - Linux HiDPI icon
- **icon.png** - Base icon (1024x1024 aanbevolen)

## Tijdelijke Oplossing

Voor development kun je tijdelijk een simpele placeholder gebruiken. De app zal een standaard Tauri icon tonen totdat je je eigen icons toevoegt.

## Design Tips

Voor een JARVIS-style app, overweeg:
- Neon blue circulaire vorm
- Gloeiend effect
- Arc Reactor geïnspireerd design
- Minimalistisch, tech-achtig
