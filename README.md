# SABBATH PROGRAM PLAYER

A single-page brutalist media player for church Sabbath programs, styled exactly like the event's poster. Self-contained, offline-capable, no frameworks.

## Features

- **Audio Loading**: Multiple ways to load tracks
  - **Bulk load**: Click "+ LOAD AUDIO FILES" button to select multiple files at once (assigned to tracks in order)
  - **Per-track load**: Click an unloaded (dimmed) track to load a file for that exact slot
  - **Drag & drop**: Drop files anywhere to fill empty slots in order, or drop a single file directly onto a track row to assign it there

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

- **OS Media Keys**
  - Play/pause and prev/next work from your keyboard media keys and lock screen (Media Session API)

- **Offline-Ready**
  - Single self-contained `index.html` file
  - Works completely offline once loaded
  - Works on mobile browsers


## Admin Dashboard & Song Library (NEW)

The player now loads its tracklist, program schedule, and songs from a server —
open the site on **any device** and the songs are already there.

- **Player** (`/`): fetches tracks + program from `/api/data` on load. Tracks with
  uploaded audio play instantly. Local drag & drop still works as an override.
- **Admin** (`/admin`): log in to edit song titles/slots, reorder/add/remove tracks,
  edit the program schedule, and upload songs (max 60MB each). Press **SAVE ALL
  CHANGES** to publish — the player picks it up on next load.
- **AUTOPLAY toggle**: next to FADE. OFF = manual play per song (default),
  ON = auto-advance through the playlist.

### Login

- Username: `admin`
- Password: `EPHESUS26-SABBATH` (default — **change it**, see below)

## Phone Remote Control (NEW)

Open **`/remote`** on your phone to control the player running on the PC:
play/pause, previous/next, tap a track to play it, volume, seek, and the
FADE / AUTOPLAY toggles. Log in with the same admin credentials.

- Works from anywhere (goes through the server, not your Wi-Fi) — the phone
  and the PC just both need internet.
- The PC player picks commands up near-instantly (long-polling), even when
  its browser tab is in the background.
- The remote shows PLAYER ONLINE/OFFLINE, what's playing, and live progress.
- Keep only one player tab open on one PC — two open players would both obey
  the remote.
- No extra setup: commands travel through the Vercel Runtime Cache, which is
  built in. Sending commands requires the admin login; in the very unlikely
  case the cache drops a command, just tap the button again.

### One-time Vercel setup (required)

1. In the Vercel dashboard, open the project → **Storage** → **Create Database** →
   **Blob** → connect it to this project. This auto-adds the `BLOB_READ_WRITE_TOKEN`
   env var that uploads and saves need.
2. (Strongly recommended) Project → **Settings** → **Environment Variables**, add:
   - `ADMIN_PASSWORD` — your own password (the default above is in the public repo!)
   - `ADMIN_USER` — optional, defaults to `admin`
3. Redeploy. Until the Blob store exists, the player just uses the built-in
   defaults and the admin SAVE shows an error.

### Where files live

- **Songs**: Vercel Blob storage (uploaded via the admin dashboard) — *not* in GitHub.
- **Cover image**: embedded in `index.html` as base64 — nothing to upload.
- **Tracklist/program data**: a small JSON blob, rewritten on every admin save.

### API

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/data` | GET | public | Current tracks + program |
| `/api/login` | POST | credentials | Returns a 7-day session token |
| `/api/admin` | POST | token | Save tracks + program |
| `/api/upload` | POST | token | Issues client-upload tokens for Vercel Blob |
| `/api/remote` | GET | public | Player long-polls commands; phone polls player state |
| `/api/remote` | POST | token for commands | Phone sends commands; player reports its state |

## How to Use

### Basic Playback
1. Open `index.html` in a web browser
2. Load audio files:
   - Click "+ LOAD AUDIO FILES" and select up to 8 files in order, OR
   - Click a dimmed track to load a single file for that slot, OR
   - Drag & drop files onto the page (or onto a specific track row)
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

The vintage Ephesus engraving is embedded directly in the file as base64 (so the app stays a single offline file). To swap it:

1. **Via external URL**: In `index.html`, find the `<img src="data:image/jpeg;base64,...` inside the `.cover` div and change the `src` to your image URL (must be reachable when offline-less is okay)

2. **Self-contained (no external dependencies)**: 
   - Convert your image to base64:
     - Online tool: https://www.base64-image.de/ (or any image-to-base64 converter)
     - Or use CLI: `base64 -i ephesus.jpg | tr -d '\n'`
   - Replace the existing `data:image/jpeg;base64,...` value with `data:image/jpeg;base64,<your-base64-here>`

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

- Files are loaded locally via `URL.createObjectURL` and stay in memory (not uploaded anywhere)
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
