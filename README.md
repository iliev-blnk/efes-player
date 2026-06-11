# SABBATH PROGRAM PLAYER

A single-page brutalist media player for church Sabbath programs, styled exactly like the event's poster. Self-contained, offline-capable, no frameworks.

## Features

- **Audio Loading**: Multiple ways to load tracks
  - **Bulk load**: Click "+ LOAD AUDIO FILES" button to select multiple files at once
  - **Per-track load**: Double-click an unloaded (dimmed) track to load a specific file
  - **Drag & drop**: Drag audio files anywhere on the page to load them

- **Fade Transitions**: Smooth ~900ms fade when switching tracks (toggle with FADE button or press `F`)
  - Respects your volume slider as the ceiling
  - Shorter ~500ms fade for play/pause

- **Playback**
  - Play/pause, skip forward/backward (skips unloaded tracks)
  - Click any loaded track to play it
  - Auto-advances to next loaded track when one finishes
  - Click the seek bar to jump to a position

- **Keyboard Shortcuts**
  - `Space`: Play/pause
  - `←` / `→`: Previous/next track
  - `F`: Toggle fade mode

- **Persistent Settings** (using browser localStorage)
  - Volume level
  - Fade mode state

- **Tab Title Indicator**
  - Shows ▶ or ⏸ + current song title in the browser tab

- **Offline-Ready**
  - Single self-contained `index.html` file
  - Works completely offline once loaded
  - Works on mobile browsers

## How to Use

### Basic Playback
1. Open `index.html` in a web browser
2. Load audio files:
   - Click "+ LOAD AUDIO FILES" and select up to 8 files in order, OR
   - Double-click a track to load a single file for that slot, OR
   - Drag & drop files onto the page
3. Click a loaded track to play it (white box = now playing)
4. Use ▶/⏸ to pause/resume, or press `Space`
5. Use ⏮/⏭ to skip tracks, or press `←`/`→`

### Editing the Tracklist

Open `index.html` in a text editor and find this section near the top of the `<script>`:

```javascript
const TRACKS = [
  {title:"AMAZING GRACE",             slot:"OPENING - 13:00"},
  {title:"BLESSED ASSURANCE",         slot:"HYMN (NO:1) - 15:00"},
  // ... etc
];
```

Change the titles and slots as needed. Keep the same structure. **Tip:** Keep slots under ~25 characters to fit the layout nicely.

### Changing the Cover Image

The cover is currently a placeholder. To add your own:

1. **Via external URL**: In `index.html`, find `<img id="coverImg"` and change the `src` to your image URL (must be a CORS-friendly source)

2. **Self-contained (no external dependencies)**: 
   - Convert your image to base64:
     - Online tool: https://www.base64-image.de/ (or any image-to-base64 converter)
     - Or use CLI: `base64 -i ephesus.jpg | tr -d '\n'`
   - Replace the entire `data:image/svg+xml,...` with `data:image/jpeg;base64,<your-base64-here>`

Example: `src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."`

### Program Schedule

The schedule is built into the right column. To edit, find the `PROGRAM` array in the script:

```javascript
const PROGRAM = [
  ["13:00","WELCOME - PRAYER - HYMN",false],
  ["15:00","HYMN (NO:1)",true],  // ← true = white highlight
  // ...
];
```

Format: `["HH:MM", "ACTIVITY NAME", isMusic]`
- Set `true` for music moments (gets white box highlight)
- Set `false` for other events

### Installation / Offline Use

- **Desktop**: Just open `index.html` in any modern browser
- **Mobile web app**: 
  - Open in Safari or Chrome, look for "Add to Home Screen"
  - The app declares `manifest.json` for standalone display
  - Will work offline once cached

### Technical Notes

- Files are loaded locally via `FileReader` and stored in memory (not uploaded anywhere)
- Fade transitions use `requestAnimationFrame` and volume ramping
- Volume and fade state persist via browser `localStorage`
- Single `.html` file with embedded styles and scripts
- No dependencies, no build step required

### Browser Support

Works on:
- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Mobile browsers (iOS Safari, Chrome Mobile)

All modern browsers with HTML5 audio and `FileReader` support.

---

**Design**: Brutalist, retro print aesthetic. Yellow (#FFFF00), black (#000000), white (#FFFFFF), Space Mono Bold.  
**License**: Open for use and modification.
