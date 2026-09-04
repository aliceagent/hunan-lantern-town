# Path activities (queue law)

Every finished clip must leave **≥2 new unrendered paths** on its last-frame still.
Prefer these over generic `forward` / `back`:

1. **Enter a building** — doorway, shop, stall, upstairs room. She walks IN.
2. **Journey** — along a street, across a bridge, up stairs, along the bank (feet dry).
3. **Close-up / object** — rice, lantern, bowl. `kind: look`. Last frame fills with the object.
4. **Interact (hands)** — she **uses** the thing: smell rice, ring a bell, pull a curtain aside, knock, lift a lantern, dip a ladle. Walking past is a fail. Last frame shows the result (bell swinging, curtain open, steam in her face). See `docs/object-interactions.md`.
5. **Character** — walk toward a townsfolk or look at their hands/work.

Never water. Never overlap existing boxes. 1024×576 extra-fast.
Alice reads `docs/town-lore.json` when present to pick the next unused journey.
