# Research: why airplane windows have a tiny hole

Topic tests: everyday ✔ · surprising "why" ✔ · failure chain (as design trade-offs, see below) ✔ · drawable cutaway ✔ · real name ("breather hole") ✔

## Sources
| Tier | Source | What it contributes |
|---|---|---|
| 1 (interview + manual) | Gizmodo, "Why Is There A Hole In Airplane Windows?" (R. Gonzalez, 2015): https://gizmodo.com/why-is-there-a-hole-in-airplane-windows-1703660371 | Interviews GKN Aerospace's technology director and quotes the Boeing 737 maintenance manual: pane roles, breather-hole purpose, fail-safe design, "preclude fogging and frosting" |
| 2 | Travel + Leisure via TIME (2017): https://time.com/4725944/tiny-hole-airplane-windows-travel | Hole is called a breather hole; every window has it; outer pane is the one that gives out; hole helps keep the window fog-free |
| leads | Fortune, AOL/Travel+Leisure, GlobalAir, NZ Herald (search results) | Used only to cross-check; several repeat the same explanation, some conflict on which pane is structural. The Gizmodo/maintenance-manual version was used to settle it |

## Claim table
| # | Claim used in the video | Source | Conf. | Script wording |
|---|---|---|---|---|
| 1 | Window = outer, middle, inner panes, all acrylic; inner is a non-structural "scratch pane" | Gizmodo | high | "three layers of plastic"; "inner pane keeps scratches away" |
| 2 | Cruise: outside ≈3.4 psi vs cabin ≈11 psi (≈7,000 ft); pressure difference loads the window | Gizmodo (citing AVS, Air & Space) | high | "air outside is thin and freezing… cabin is pressurized" (*freezing* = standard-atmosphere common knowledge) |
| 3 | The outer pane is the primary structural pane and carries the cabin pressure | Gizmodo (GKN quote) | high | "the outer pane is built to take the whole push" |
| 4 | The middle pane is a fail-safe, designed to hold cabin pressure if the outer pane fractures (rare) | Gizmodo (GKN + 737 manual) | high | "the middle pane takes over and holds the cabin's air" |
| 5 | Breather hole is near the bottom of the middle pane; it lets cabin pressure equalise into the gap so pressure is applied only to the outer pane, preserving the middle pane | Gizmodo | high | "added a pinprick hole… Cabin air seeps through… both sides of the middle pane match" |
| 6 | Without the hole the middle pane would share the pressure load | **Inference** from #5 (the hole's purpose is to prevent exactly this) | medium | "seal the space… the middle pane has to share the load" |
| 7 | Sharing the load would use up / wear the spare | **Inference** from #5 ("preserving the middle pane") | medium | "it would wear down, and the spare would no longer be a spare" (conditional) |
| 8 | Fog/frost between panes is a concern the air-gap design aims to prevent; the hole helps by letting moisture out | Gizmodo (manual: "preclude fogging and frosting", but windows often fog anyway); TIME (hole wicks moisture) | medium | hedged: "could trap moisture… might fog"; "moisture **can** escape… **helps** keep the view clear" |
| 9 | Every window has the hole | TIME | medium | "your airplane window" (not a claim of *every* window) |
| 10 | The outer pane is the one expected to give out under extra strain | TIME, Gizmodo (#3/#4) | medium | hook: "deciding which layer breaks first" |

## Deliberately NOT claimed
- *Who* added the hole, *when*, or *how* (drilled vs moulded): not in any source → the script says "added".
- "While the pilots descend": not in the primary source → cut.
- Any historical chain of failed designs (e.g. 1950s square-window fatigue failures) → a different story; not used.
- Pane thicknesses, the hole's diameter, "1.5 × operating pressure" (737 manual figure): left out of narration.

## Failure chain (design trade-offs, phrased conditionally)
```
Problem : cabin pressure pushes out on the window
Fix 1   : let the outer pane take it (it does) ... backup pane waits behind
Fix 2   : seal the gap between the panes -> middle pane shares the load -> the spare wears down
Fix 3   : (the sealed gap also traps moisture -> fog/frost)         [hedged]
Insight : add a pinprick hole in the middle pane -> gap equalises with the cabin
Mechanism: cabin air seeps in; middle pane sees equal pressure on both sides; outer pane carries the push
Payoff  : if the outer pane cracks, the middle pane (still fresh) holds the cabin's air
Name    : the breather hole
Echo    : "…your airplane window"
```
