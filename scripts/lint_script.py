#!/usr/bin/env python3
"""Lint a story.json narration against the measured style of the reference videos.

usage: python3 lint_script.py path/to/story.json [--words]
  --words   also print every beat with word indices (handy for sfx `atWord` anchors)

Reference measurements (2 videos): 215-224 words in 71-79 s (~2.9 words/s, 170-180 wpm),
sentence length avg 11-13 words (min 4, max 21), 6 of ~19 sentences open with "So," / "But,",
one "Finally," before the insight, one "That is the ___." naming line, one "Today," closer
that echoes the opening words so the short loops.
"""
import json, re, sys

story = json.load(open(sys.argv[1]))
beats = story["beats"]
meta = story["meta"]
WPS = meta.get("wps", 2.9)
tok = lambda s: re.findall(r"[A-Za-z0-9']+", s)
issues, notes = [], []

text = " ".join(b["text"] for b in beats)
words = tok(text)
sents = [s.strip() for s in re.split(r"(?<=[.?!])\s+", text) if s.strip()]
lens = [len(tok(s)) for s in sents]
est = len(words) / WPS + 0.14 * len(beats) + meta.get("tail", 0.6)

print(f"beats {len(beats)} | words {len(words)} | sentences {len(sents)} | est. runtime {est:.0f}s at {WPS} words/s")
print(f"sentence length: avg {sum(lens)/len(lens):.1f}, min {min(lens)}, max {max(lens)}   (reference: avg 11-13, max 21)")

if not 60 <= est <= 85: issues.append(f"runtime ~{est:.0f}s is outside 60-85s (reference 71-79s)")
if not 190 <= len(words) <= 235: issues.append(f"{len(words)} words; target 190-235 for a ~75s short")
for s, n in zip(sents, lens):
    if n > 21: issues.append(f"long sentence ({n} words): {s[:70]}...")
for b in beats:
    n = len(tok(b["text"]))
    if n > 24: issues.append(f"{b['id']}: {n} words in one beat; split it (captions/camera need room)")
    if not b.get("cam"): issues.append(f"{b['id']}: no camera keys")
    if not b.get("sfx"): notes.append(f"{b['id']}: no sfx cues (fine for 1-2 beats, but aim for roughly one cue per 1.5-2 s of screen time)")

starts = lambda p: sum(1 for s in sents if s.startswith(p))
pivots = starts("So,") + starts("But,") + starts("And")
print(f"pivot sentences (So,/But,/And): {pivots}   Finally: {starts('Finally,')}   'That is': {starts('That is')}   Today: {starts('Today,')}")
if pivots < 3: issues.append("too few So,/But, pivots: the 'fix -> it fails -> new fix' chain is the engine of this format")
if starts("Finally,") != 1: issues.append("use exactly one 'Finally,' to introduce the real insight")
if not starts("That is"): issues.append("missing the 'That is the <name>.' naming line")
if not sents[-1].startswith("Today,"): issues.append("last sentence should start with 'Today,'")

# loop echo: last sentence should repeat the opening noun phrase
first, last = {w.lower() for w in tok(sents[0])}, {w.lower() for w in tok(sents[-1])}
common = (first & last) - {"the", "a", "an", "of", "in", "on", "it", "is", "your", "to", "and", "today"}
print(f"loop echo words (first vs last sentence): {sorted(common)}")
if len(common) < 2: issues.append("closing line should echo the opening words so the video loops cleanly")

for w in ["utilize", "leverage", "paradigm", "revolutionary", "game-changer", "amazing", "incredible", "literally", "basically", "innovative"]:
    if re.search(rf"\b{w}\b", text, re.I): issues.append(f"hype/jargon word: {w}")
if re.search(r"\d{3,}", text): notes.append("big numbers in narration are hard to hear; prefer words ('about eight thousand feet')")

if "--words" in sys.argv:
    print()
    for b in beats:
        print(b["id"], " ".join(f"{i}:{w}" for i, w in enumerate(b["text"].split())))

print()
for n in notes: print("note :", n)
for i in issues: print("WARN :", i)
print("\nPASS" if not issues else f"\n{len(issues)} warning(s)")
sys.exit(1 if issues else 0)
