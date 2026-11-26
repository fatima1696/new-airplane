# Why airplane windows have a tiny hole

9:16 miniature-diorama explainer short, built with **Remotion + React Three Fiber**. This repo is code only: you render it.

## One-time setup
```bash
npm install                      # Node 18+ (20+ recommended)
pip install edge-tts             # only if you want free neural TTS for the narration
```

## Make the video
```bash
npm run sfx        # (optional) regenerate sound effects into public/sfx (already committed)
npm run voice      # narration: one MP3 + word-timing JSON per beat in public/voice  (needs internet)
npm run timeline   # merges narration timing + story.json into public/timeline.json
npm run check      # camera framing QA + loop check (fails on clipped shots)
npm run studio     # live preview in the browser; scrub to check shots
npm run still      # render one frame to out/still.png
npm run render     # -> out/video.mp4  (1080x1920, 30 fps, H.264)
```
Skip `npm run voice` to preview with **estimated** timing and no narration.

### Using your own voice / ElevenLabs / OpenAI TTS
Save each beat's audio as `public/voice/<beat id>.mp3` (ids are in `src/story/story.json`), then:
```bash
python3 scripts/make_voiceover.py --engine file && npm run timeline
```
(Word timings are estimated. For exact caption sync, align the audio with a forced aligner and write `public/voice/<id>.json` as `{"duration": s, "words": [{"w","s","e"}]}`.)

## Edit the video
- `src/story/story.json`: narration, camera keys, SFX cues, whips, framing checks (schema in the skill's `references/story-schema.md`).
- `src/scene/*.tsx`: the 3D set pieces. Everything must be a pure function of time (no `useFrame`, no `Math.random`).
- Change the brass-plate text in `story.json` → `meta.brand`.
- Better sound effects: replace any file in `public/sfx/` with a recording of the same name and update `manifest.json`.

## Notes
- Three.js needs the ANGLE GL backend; it is already set in `remotion.config.ts`.
- Captions use Google's Jost font (downloaded by Remotion at render time).
- All `remotion` / `@remotion/*` versions are pinned to the same exact version; keep them aligned if you upgrade.

## Render on GitHub (no local setup)
1. Push this repo to GitHub (make sure the hidden `.github` folder is included).
2. **Actions** tab → **Render video** → **Run workflow**. First try `frames = 0-60` as a quick test.
3. When it finishes, download `video` from the run's **Artifacts**.

Notes: GitHub's machines have no GPU, so the config switches to the software `swangle` renderer when `CI` is set; expect a full render to take on the order of an hour or more. Narration uses edge-tts on the runner; if Microsoft's service refuses cloud IPs, run `npm run voice` locally, commit `public/voice/`, and untick "voice" when starting the workflow.
