#!/usr/bin/env python3
"""Generate narration audio + word timings for every beat in src/story/story.json.

  pip install edge-tts           # free Microsoft Edge neural voices (unofficial API, needs internet)
  python3 scripts/make_voiceover.py                  # all beats
  python3 scripts/make_voiceover.py --only b03 b07   # just these beats
  python3 scripts/make_voiceover.py --engine file    # you supply public/voice/<id>.mp3 yourself

Outputs per beat:  public/voice/<id>.mp3  and  public/voice/<id>.json  {duration, words:[{w,s,e}]}

Using your own voice / ElevenLabs / OpenAI TTS instead?  Save each beat's audio as
public/voice/<id>.mp3, run with --engine file, and word timings are estimated
(or run a forced aligner such as whisper-timestamped and write the same .json shape).
"""
import argparse, asyncio, json, pathlib, shutil, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE_DIR = ROOT / "public" / "voice"


def probe_duration(path: pathlib.Path, nbytes: int | None = None) -> float:
    if shutil.which("ffprobe"):
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True,
        )
        try:
            return float(r.stdout.strip())
        except ValueError:
            pass
    # edge-tts returns 24 kHz / 48 kbps CBR mono MP3 => 6000 bytes per second
    return (nbytes or path.stat().st_size) / 6000.0


async def tts_edge(text: str, voice: str, rate: str, pitch: str):
    import edge_tts

    try:
        comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    except TypeError:  # older edge-tts: WordBoundary is the default
        comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    audio = bytearray()
    words = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            s = chunk["offset"] / 1e7
            words.append({"w": chunk["text"], "s": s, "e": s + chunk["duration"] / 1e7})
    return bytes(audio), words


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=["edge", "file"], default="edge")
    ap.add_argument("--only", nargs="*", default=[])
    args = ap.parse_args()

    story = json.loads((ROOT / "src/story/story.json").read_text())
    v = story["meta"].get("voice", {})
    voice = v.get("voice", "en-US-AndrewNeural")
    rate = v.get("rate", "+10%")
    pitch = v.get("pitch", "+0Hz")
    VOICE_DIR.mkdir(parents=True, exist_ok=True)

    for b in story["beats"]:
        if args.only and b["id"] not in args.only:
            continue
        mp3 = VOICE_DIR / f"{b['id']}.mp3"
        words = []
        nbytes = None
        if args.engine == "edge":
            data, words = await tts_edge(b["text"], voice, rate, pitch)
            mp3.write_bytes(data)
            nbytes = len(data)
        elif not mp3.exists():
            print(f"  {b['id']}: missing {mp3.name} (engine=file)")
            continue
        dur = probe_duration(mp3, nbytes)
        (VOICE_DIR / f"{b['id']}.json").write_text(json.dumps({"duration": dur, "words": words}, indent=1))
        print(f"  {b['id']}: {dur:5.2f}s  {len(b['text'].split()):3d} words  ({len(words)} timed)")
    print("done. now run: npm run timeline")


if __name__ == "__main__":
    asyncio.run(main())
