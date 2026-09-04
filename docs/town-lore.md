# 河灯镇 Town Lore — the whole floor of Lantern River Town

**Status:** Canon expansion of `docs/implementation-plan.md` §§2–3. Nothing here contradicts the character lock (§2.1), the approved Ghibli still `daf1a2609185d63d`, or the locked cultural stance. This file is the *world* the clip graph grows into; `docs/town-lore.json` is the machine copy Alice reads when seeding new paths.

**Hard invariants (repeat of the locks, so this file stands alone):**
fictional western-Hunan river town styled on Fenghuang; late-Qing / early-Republican material culture; misty autumn morning, always; no festival, no supernatural, no tourists, no readable signage, no temple gags, no dialect cosplay; NPCs silent in v1 and standard Mandarin later; Wanqing is third-person, whole figure, Ghibli painted; her feet stay on wood, stone, or packed earth — never on or in the water.

---

## 1. Town history — why lanterns, why this river, why today

河灯镇 (Hédēng Zhèn) sits where the 河灯江 — the Lantern River, green, shallow, slow — bends around a low shoulder of hill and widens enough for boats to turn. That bend is the whole reason the town exists. Upriver the valley narrows into rapids no laden sampan can climb; downriver the water runs deep and easy to the market cities. So for as long as anyone's grandmother remembers, everything the upper valleys grow — rice, tung oil, dried chilies, indigo leaf, timber — has come down the mountain paths on shoulder-poles to *this* bend, to be weighed, argued over, and loaded onto flat boats at the old ferry dock. A porters' town first, then a boatmen's town, then — once the covered bridge went up so the two banks could trade without waiting on the ferry — a proper market town with a flagstone street, a tea house where deals are sealed, and stilt-legged 吊脚楼 crowding out over the water because flat land at a river bend is scarce and nobody wastes it.

The lanterns came from the boatmen. On the Lantern River the autumn mists sit in the bend until mid-morning, thick enough that a boat poling in from downstream cannot see the dock until it is nearly upon the stones. So the households along the water took to hanging paper lanterns from their eaves and balconies — not for beauty at first, but so that a late boat could count the warm points of light and know exactly where the town began and where the shallows were. Each waterside household keeps its own lantern in its own remembered place, and a boatman who knows the town can read the shoreline in the dark like a sentence. Over the generations the habit became the town's craft and its name: the lantern workshop on the old street ribs and papers lanterns for half the river valley, and a household that gains a member adds a lantern to its eave the way another town might plant a tree. By day — and this is the town the player sees — the lanterns hang unlit in the mist, dozens of dull-red paper moons waiting for evening. The game never shows the evening. The unlit lantern is the town's promise to itself, and the player only ever sees the promise.

**Why Wanqing arrived today.** Shen Wanqing, 19, grew up two valleys upriver in a farming village small enough that she knows river life — poles, mist, rice terraces — but has never lived anywhere with a *street*. Her great-aunt, 沈姑婆, widow of a Lantern River ferryman, keeps a small courtyard house up the back lane and is getting too old to haul water and mind the kitchen alone. Letters went back and forth over the summer; a place was made. Wanqing came down yesterday evening on the last boat, slept in a room that still smells of someone else's stored quilts, and this morning — the morning of the game — has been sent out with a small round wicker basket and no list, because her great-aunt is wise enough to know that the real errand is *learn the town*. Everyone Wanqing passes already half-knows who she is; the town knew she was coming before she did. That is why the story can unfold without a single quest marker: the town is quietly, politely, already making room for her, and an observant player watches it happen.

---

## 2. Map of districts

The town is one connected walking floor on the two banks of the river bend. Spawn is the Flagstone Old Street (L4, still `daf1a2609185d63d`). Distances are small — everything below is under five minutes' walk from the spawn — but every move is a made clip, so the *graph* is what matters:

```
                    水磨坊 Water Mill (upstream)
                         │ millrace walk
拱月桥 Arched Moon Bridge ═══════════════ far bank landing
      │                                        │
石板老街 Flagstone Old Street ──────── 吊脚楼水巷 Stilt-House Walk ── 染坊 Dye Yard
  │(spawn)│    │        │                      │
老茶馆   灯笼铺  井巷 Well Lane            老码头 Old Ferry Dock
Tea House Lantern  │      │
          Workshop 学堂  姑婆的院子
                 School  Great-Aunt's Courtyard
```

Adjacency for clip authoring (superset of the plan's L1–L5 adjacency, which stays valid):
street ↔ bridge, street ↔ stilt-walk, street ↔ lantern-workshop, street ↔ dock, street ↔ tea-house, street ↔ well-lane; well-lane ↔ school, well-lane ↔ courtyard; bridge ↔ mill (via far-bank path), bridge ↔ stilt-walk; stilt-walk ↔ dock, stilt-walk ↔ dye-yard.

Each district below gives: names, mood, what you see, its rooms/spaces (these are the future frame clusters), and **journeys** — movement clips that carry the player *through* the town, not camera pans. Journey `kind` follows the manifest vocabulary: `walk` (travel between spaces), `enter` (cross a threshold into an interior or up stairs into a room), `look` (approach + close-up; per errata #20 the last frame must be a close-up), and `interact` (she uses her hands or face on a tapped object; law and per-district catalog in §8).

---

### 2.1 石板老街 — Shíbǎn Lǎojiē — Flagstone Old Street *(spawn · expands L4)*

**Mood:** the town's held breath before full waking. Wet stone, first customers, steam the only thing moving fast.

**What you see:** a lane of dark rain-wet flagstones polished into shallow hollows by a century of straw sandals; two-storey timber shopfronts with their door-boards half taken down; strings of unlit red lanterns sagging between eaves; the breakfast stall's cauldron throwing a fat white column of steam; a hand-cart of river stone parked askew; a paper umbrella drying against a wall; mist closing off both ends of the street so the town seems to end in white.

**Rooms / spaces:**
1. **Street hub** (the spawn still) — the wide point of the lane where stall, tea house, and shop mouths all face each other.
2. **Noodle-stall awning** (米粉摊) — Tian Shu's three low tables under an oil-cloth awning, benches wiped, chili jars in a row, the cauldron of bone broth at a rolling simmer.
3. **General store front room** (杂货铺) — a dim deep room smelling of kerosene and dried mushrooms: coils of rope, paper packets tied with grass string, a shopkeeper's counter with a worn abacus.
4. **General store back room** — stacked wide-mouth jars, a ladder to nowhere, sacks stenciled with characters too faded to read (nothing legible — locked).

**Journeys:**
- *Walk* the length of the street north until the mist opens onto the bridge approach.
- *Enter* the noodle stall: step under the dripping awning edge and stop between the benches, the steam rolling past her face.
- *Enter* the general store: step over the high wooden threshold into the dim, letting her eyes adjust.
- *Look:* she crosses to the resting hand-cart and the umbrella against the wall; close on the oil-paper umbrella, beads of mist on its ribs.

---

### 2.2 老茶馆 — Lǎo Cháguǎn — The Old Tea House *(on the street; new)*

**Mood:** the town's parliament, still mostly empty; the day's first pot already breathing.

**What you see:** an open double-door front, floor of tamped earth gone glossy, square tables with benches, a giant dented brass kettle on a clay stove, rows of lidded bowls on a shelf, one old regular already installed by the window with a birdcage (cloth still over it). Upstairs, a small balcony room hangs out over the water on stilt legs.

**Rooms / spaces:**
1. **Main hall** — tables, stove-glow on one wall, Shi Laoban drying bowls with a grey cloth.
2. **Stove corner** — the boy A-Jiu feeding twigs to the fire under the kettle, sleeve-guards to his elbows.
3. **Upstairs river room** — the best room: a low table, an open window full of green river and mist, one string of the house's lanterns visible from *inside*, hanging just past the eave.

**Journeys:**
- *Enter* from the street: through the double doors into the main hall, between the tables, stopping where the stove-light touches the floor.
- *Enter* upstairs: up the steep boxed staircase, hand on the smooth rail, into the river room and toward the open window.
- *Look:* she approaches the clay stove; close on the brass kettle's dented flank, wisps of steam at the spout.

---

### 2.3 拱月桥 — Gǒngyuè Qiáo — Arched Moon Bridge *(expands L1)*

**Mood:** a wooden tunnel of quiet; footsteps get loud, the river goes silent underneath.

**What you see:** a covered wind-rain bridge, dark timber, tile roof shaggy with moss; inside, a gallery of thick posts and benches worn shiny; unlit lanterns down the whole ridgeline; below the rail, green slow water and a moored sampan; the far bank arriving out of the mist plank by plank.

**Rooms / spaces:**
1. **Bridge gallery** (near half) — the covered walkway, benches between posts, resin smell.
2. **Mid-span bench bay** — a widened bay with rail-side benches where old men will sit by noon; best view up and down the river.
3. **Far-bank landing** — stone steps off the bridge down to a packed-earth path that forks: upstream to the mill, downstream along the stilt-houses.

**Journeys:**
- *Enter* the bridge from the street approach: up the low stone ramp and in under the roof, the light going wooden and dim.
- *Walk* the span: down the center of the gallery toward the far mouth, posts sliding past, the far bank brightening.
- *Walk* off the far end and down the stone steps onto the earthen far-bank path.
- *Look:* she stops at the mid-span rail; close on the moored sampan below, rope slack in the green water. *(Rail-lean, feet on bridge planks — never on the water.)*

---

### 2.4 吊脚楼水巷 — Diàojiǎolóu Shuǐxiàng — Stilt-House Waterside Walk *(expands L2)*

**Mood:** domestic morning conducted at balcony height; the town's laundry, breakfast smoke, and gossip all hang over the same water.

**What you see:** a plank boardwalk running below a leaning row of stilt houses, their timber legs black with waterline; laundry lines of indigo jackets and grey skirts; strings of drying red chilies and corn under every eave; a sleeping cat on a warm windowsill; cooking smoke seeping through roof tiles; each household's lantern hanging unlit in its remembered place.

**Rooms / spaces:**
1. **Boardwalk** — the water-street itself, planks springy, gaps showing green water (she stays on the planks).
2. **Tian house ground room** — the open ground floor of one stilt house: loom, grain jars, a fire pit with a blackened kettle on a chain.
3. **Tian house upstairs room** — up a ladder-steep stair: sleeping mats, a red-painted dowry chest, a small window right over the river.
4. **Laundry balcony** — the cantilevered drying balcony where Tian Xiaoman pins up washing, poles of dripping indigo cloth racked overhead.

**Journeys:**
- *Walk* the boardwalk from the street end toward the dock end, ducking one low laundry pole.
- *Enter* the Tian house: through the open doorway into the ground room, stopping by the loom.
- *Enter* upstairs: up the steep wooden stair into the low upstairs room, toward the little river window.
- *Look:* she stops beneath the eave; close on the drying chilies, red beads strung against grey wood.

---

### 2.5 老码头 — Lǎo Mǎtou — Old Ferry Dock *(expands L3)*

**Mood:** the town's front door, half asleep; mist thickest here, sounds arrive before their objects.

**What you see:** broad stone steps descending to the water in worn tiers; a stone mooring post with a wet coiled rope; Uncle Chen's flat ferry nosed against the lowest dry step; a second, older sampan hauled out on the stones with Yang the carpenter kneeling at a sprung plank; a small waiting shed with a bench; Chen's one-room hut with a fish-basket by the door.

**Rooms / spaces:**
1. **Stone water-steps** — the tiered steps; the player can go as low as the last *dry* tier, never onto the boat or the water.
2. **Waiting shed** — three walls and a bench, a wall of old high-water scratches (marks, not writing).
3. **Uncle Chen's hut** — one room: a plank bed, a straw rain-cape (蓑衣) on a peg, a cold stove, two bowls washed and upside down — two, though he lives alone.

**Journeys:**
- *Walk* down from the street to the head of the dock steps, mooring post looming out of the mist.
- *Enter* the waiting shed: in under its low roof and toward the bench and the scratched wall.
- *Enter* the hut: through the low doorway into Chen's room, stooping slightly, stopping inside as her eyes adjust.
- *Look:* she descends two tiers of steps toward the beached sampan; close on Yang's hands fitting a fresh pale plank into the dark hull.

---

### 2.6 灯笼铺 — Dēnglong Pù — The Lantern Workshop *(expands L5)*

**Mood:** the town's warmest room even with nothing lit; red paper everywhere holds its own glow in the grey.

**What you see:** an open storefront hung solid with finished red lanterns, big and small; inside, Auntie Luo at a bench of bamboo ribs, paste pot, and brushes; a drying loft above where papered frames hang in rows to cure; a back yard of soaking bamboo and split canes. On the end of the bench, set apart from the red: one small lantern frame, freshly ribbed, not yet papered.

**Rooms / spaces:**
1. **Storefront** — the lantern-hung open front onto the street.
2. **Workbench room** — Luo's bench, tools in a worn roll, paste smell, a wall of paper stock in reds and one shelf of undyed white.
3. **Drying loft** — up a ladder-stair: rows of curing lanterns like pale fruit, light coming through them from a small window.
4. **Back yard** — a wet little court where bamboo soaks in a stone trough and Doudou's cat patrols the wall.

**Journeys:**
- *Enter* from the street: in under the hanging lanterns, brushing beneath the lowest one, to stand before the workbench.
- *Enter* the loft: up the ladder-stair into the drying loft, rows of curing lanterns opening around her.
- *Walk* through the workbench room and out the back door into the bamboo yard.
- *Look:* she leans toward the end of the bench; close on the small unpapered lantern frame, bamboo ribs tied with red thread.

---

### 2.7 井巷 — Jǐng Xiàng — Well Lane *(new)*

**Mood:** the town's back-of-house; narrower, quieter, more private than the street — the lane where you're a neighbor, not a customer.

**What you see:** a narrow climbing lane of packed earth and stone steps between high whitewashed walls streaked with rain; the public well in a small court, its stone lip rope-grooved, a full bucket standing beside it; the herb shop's shutter half open, bundles of drying plants under the eave; gates in the walls — one of them her great-aunt's.

**Rooms / spaces:**
1. **Well court** — the widened bend with the well, a stone bench, an old woman's washing paddle leaning by a basin.
2. **Herb shop front** (药铺) — a counter of many small drawers, hand scales, Wu Popo weighing something pale into paper.
3. **Herb drying room** — behind a curtain: racks of cut roots and leaves, the air thick and bittersweet.

**Journeys:**
- *Walk* up from the street into the lane, walls narrowing, the well court opening ahead.
- *Enter* the herb shop: through the half-shuttered front, into the drawer-lined dimness, up to the counter.
- *Look:* she crosses the court to the well; close on the rope-grooved stone lip and the full wooden bucket beaded with mist.

---

### 2.8 姑婆的院子 — Gūpó de Yuànzi — Great-Aunt's Courtyard *(new — Wanqing's home)*

**Mood:** the one place in town that is *hers* now; small, swept, exact. Everything old except the things put out for her, which are conspicuously new.

**What you see:** a black-lacquered gate in the lane wall with a wrapped bundle of river fish hanging on its handle (see beats); inside, a pocket courtyard with one persimmon tree still holding fruit, a stone sink, herbs in cracked jars; the kitchen glowing with stove-light; a small altar room off the main room — the household altar, kept plainly and honestly: a framed portrait of a middle-aged man, a cup of tea poured fresh this morning, two oranges, a stick of incense burnt down to grey. *(This is a home altar treated with a home's respect — the plan's cultural lock applies with full force: it is never a gag, never supernatural, never a game mechanic. It is how the player learns, wordlessly, who this house misses.)*

**Rooms / spaces:**
1. **Gate passage** — the two-leaf gate and its short covered passage into the court.
2. **Courtyard** — persimmon tree, water jar, a bamboo chair with a folded blanket.
3. **Kitchen** — wok on a mud-brick stove, steam, two bowls set out (not one), a new pair of chopsticks still paper-wrapped at one place.
4. **Wanqing's room** — a narrow bed made with a sun-smelling quilt, her small bundle from home half unpacked, a new-papered window.
5. **Altar room** — the household altar as described; beside the portrait, a small model of a flat ferry boat, carved from one piece of wood.

**Journeys:**
- *Enter* from the lane: she pushes one leaf of the black gate and steps through the passage into the courtyard.
- *Enter* the kitchen: across the court and in through the kitchen's open door, into the steam and stove-light.
- *Enter* her room: along the covered edge of the court and through the curtained doorway into the small room with her bundle.
- *Look:* she steps quietly to the altar room's threshold; close on the portrait, the fresh tea, and the little carved ferry boat.

---

### 2.9 水磨坊 — Shuǐ Mòfáng — The Water Mill *(new — upstream past the bridge)*

**Mood:** the loudest quiet place in town: one continuous wooden groan and water-rush that swallows every other sound.

**What you see:** upstream of the bridge on the far bank, a low tile-roofed mill straddling a stone millrace; the dark dripping wheel turning slow; inside, the great round stones grinding, flour dust hanging in the window light like the mist come indoors; sacks in rows; the miller Ma Er white to the elbows.

**Rooms / spaces:**
1. **Millrace walk** — the flagged path along the race to the mill door, wheel on her left, solid stone underfoot the whole way.
2. **Mill floor** — the grinding room: stones, hopper, the wooden drive shuddering in its frame.
3. **Grain loft** — up broad ladder stairs: sacks, a hanging steelyard scale, a swallow's old nest in the rafters.

**Journeys:**
- *Walk* from the bridge's far-bank landing up the flagged millrace path to the mill door, the wheel turning beside her.
- *Enter* the mill floor: through the doorway into the flour-hazed room, stopping before the turning stones.
- *Enter* the loft: up the broad ladder stairs into the grain loft, dust motes in the window light.
- *Look:* she stops on the millrace path; close on the black dripping wheel-blades rising out of the race. *(She stands on the flagged path; the water stays below and beside her.)*

---

### 2.10 学堂 — Xuétáng — The School House *(new — off Well Lane)*

**Mood:** expectation: a room set for children who haven't arrived yet; the town's future with the chairs still up.

**What you see:** through a modest gate off Well Lane, a swept front yard with a bare paulownia tree and a line of small carrying-baskets already parked by the door (the earliest children are here, somewhere, playing out back — heard, not seen); the schoolroom with low benches and a large slate; a teacher's study smelling of ink, one desk, many books, a mended long gown on a hanger.

**Rooms / spaces:**
1. **Front yard** — gate, tree, the row of little baskets, a hopscotch-like pattern scratched in the packed earth.
2. **Schoolroom** — benches, the big slate with yesterday's characters half-wiped into illegible ghosts (nothing readable — locked), a boy-sized abacus.
3. **Teacher's study** — Song Xiansheng's desk: inkstone, a covered bowl of rice noodles going cold at his elbow, papers weighted with a river stone.

**Journeys:**
- *Enter* from the lane: through the school gate into the front yard, past the parked baskets, toward the schoolroom door.
- *Enter* the schoolroom: over the threshold and down the aisle between low benches toward the great slate.
- *Look:* she pauses at the study's open door; close on the desk — inkstone, river-stone paperweight, and the covered noodle bowl still faintly steaming.

---

### 2.11 染坊 — Rǎnfáng — The Indigo Dye Yard *(new — downstream past the stilt houses)*

**Mood:** the town's color source: everything the whole valley wears begins as this yard's dripping blue.

**What you see:** where the boardwalk ends, a work yard open to the river: sunken indigo vats breathing their sharp green-blue smell, poles and frames hung with lengths of freshly dyed cloth from near-black to sky-wash, all of it dripping in slow drops; Qin Shifu, blue to the shoulders, folding wet cloth; on a clean rack apart from the rest, one short child-sized length, the best even blue in the yard.

**Rooms / spaces:**
1. **Dye yard** — the open vat yard, stone-paved, channels carrying rinse water to the river.
2. **Vat shed** — a roofed row of vats, wooden lids, long stirring poles, the smell strongest here.
3. **Drying-frame lane** — an aisle *between* the hung cloth: walking it is walking through slow blue curtains.

**Journeys:**
- *Walk* from the boardwalk's end into the dye yard, cloth-hung frames rising around her.
- *Walk* the drying-frame lane: down the aisle between hanging lengths of indigo, cloth stirring as she passes.
- *Enter* the vat shed: in under the low roof, along the row of lidded vats, to where a stirring pole leans.
- *Look:* she stops at the clean rack; close on the child-sized length of perfect blue, one drop falling from its corner.

---

## 3. Noteworthy buildings (the ten-plus, in one place)

1. **拱月桥 the Arched Moon Bridge** — the covered wind-rain bridge; the town's spine and its only dry crossing.
2. **老茶馆 the Old Tea House** — two storeys, the upstairs river room cantilevered on stilt legs; where every deal in town is eventually sealed.
3. **灯笼铺 the Lantern Workshop** — storefront, bench room, drying loft, bamboo yard; source of every lantern on the shoreline.
4. **米粉摊 Tian Shu's noodle stall** — technically a stall, practically an institution; the steam column is the street's clock.
5. **杂货铺 the general store** — deepest, darkest shop on the street; sells everything, displays nothing.
6. **田家吊脚楼 the Tian family stilt house** — the enterable stilt house: loom below, dowry chest above, laundry balcony over the river.
7. **渡口棚屋 the ferry waiting shed & 陈伯的小屋 Chen's hut** — the town's front door and its doorkeeper's one room.
8. **姑婆的院子 Great-Aunt Shen's courtyard house** — gate, persimmon court, kitchen, Wanqing's room, and the household altar.
9. **药铺 Wu Popo's herb shop** — a wall of little drawers on Well Lane; the town's memory of what cures what.
10. **水磨坊 the water mill** — wheel, race, stones, loft; grinds for every household on both banks.
11. **学堂 the school house** — yard, schoolroom, study; one teacher, all the town's children.
12. **染坊 the indigo dye yard** — vats and drying frames at the boardwalk's end; where the town's blue comes from.

---

## 4. Recurring visual motifs — H3 must keep these

Every prompt Alice writes should keep the frame inside this palette. These are the town's fingerprint; a clip missing all of them has drifted.

- **Wet dark flagstone** with shallow foot-worn hollows, mist-slick, never dusty.
- **Unlit red paper lanterns** — strings and singles, everywhere, always unlit (it is morning; the game never shows evening).
- **Steam and cooking smoke** — the noodle cauldron's white column, kettle wisps, smoke seeping through roof tiles.
- **Laundry and indigo cloth** — jackets and skirts on poles, dyed lengths on frames; indigo blue is the town's one saturated color besides lantern red.
- **The green slow river** — opaque jade-green, glassy, unhurried; always below or beside, never underfoot.
- **Morning mist** — closes off street ends and the far bank; distances dissolve to white.
- **Dark timber and moss** — stilt legs black at the waterline, tile roofs shaggy with moss, wood polished where hands go.
- **Drying food under eaves** — strings of red chilies, hung corn, fish-baskets.
- **Bamboo** — poles, ladders, baskets, lantern ribs, soaking canes.
- **No readable text anywhere** — signs are shapes, slates are ghosts, sacks are faded past legibility (locked; nothing to un-bake later).

---

## 5. Character roster

Chen Bo and Luo Shen keep their plan-locked names, looks, and stations (§3.4 of the plan). Everyone below is silent in v1; each has a **look** (one sentence H3 can use), a **station**, one **visual tell** (the repeatable detail that makes them recognizable across clips), and one **secret the player can notice without a word of dialogue**. The secrets interlock — see §6.

1. **陈伯 Chén Bó — Uncle Chen**, the ferryman. *Look:* an old wiry man in a straw rain-cape over plain dark clothes, bamboo pole in hand, standing at the dock steps watching the mist. *Tell:* the straw rain-cape, worn even when it isn't raining. *Secret:* his hut holds two washed bowls though he lives alone — and the fish hanging on the great-aunt's gate is tied with the same green cord as the fish-basket by his door. He was her late husband's oldest friend, and has left a fish on that gate every market-day morning for years.
2. **罗婶 Luó Shěn — Auntie Luo**, the lantern maker. *Look:* a sturdy middle-aged woman, apron over a dark jacket, sleeves tied back, hands always moving over bamboo ribs at her bench. *Tell:* a paste-brush tucked behind her ear like a scholar's pen. *Secret:* the small unpapered lantern frame set apart on her bench is sized for a house-eave, not for sale — and the paper laid ready beside it is the household red. It is for the great-aunt's gate: the town's quiet custom when a household gains a member. It is for Wanqing.
3. **沈姑婆 Shěn Gūpó — Great-Aunt Shen**, Wanqing's great-aunt. *Look:* a small upright old woman, silver hair in a tight bun, grey jacket immaculate, moving slowly but exactly between kitchen and court. *Tell:* she touches the persimmon tree's trunk once each time she crosses the courtyard. *Secret:* the altar room's tea is poured fresh this morning and the little carved ferry boat beside the portrait matches the real ferry at the dock, plank for plank — her husband was the town's ferryman before Chen.
4. **田叔 Tián Shū — Old Tian**, the breakfast-stall keeper. *Look:* a broad cheerful man in a white-grey apron, ladling from a huge cauldron behind a wall of steam. *Tell:* a twist of dried chili tied to his ladle handle. *Secret:* every morning he covers one full bowl and sets it aside on the stall's end board — and later that bowl is on the schoolteacher's desk. The teacher takes no money for teaching the stall-keeper's daughter; the stall feeds him anyway, pride kept intact on both sides by nobody mentioning it.
5. **田小满 Tián Xiǎomǎn — Tian Xiaoman**, Old Tian's daughter, about twelve. *Look:* a quick slight girl in a patched indigo jacket, pinning laundry on the stilt-house balcony, always half-leaning over the rail. *Tell:* one sleeve dyed noticeably newer-blue than the rest of her jacket. *Secret:* a school carrying-basket exactly like the ones parked at the school door hangs ready on the balcony post — she is starting school; the child-sized indigo length at the dye yard and the covered bowls trace her family's whole quiet arrangement.
6. **石老板 Shí Lǎobǎn — Boss Shi**, the tea house keeper. *Look:* a stout unhurried man in a buttoned grey vest, forever drying bowls with a cloth while watching the room. *Tell:* he stacks dried bowls in perfect towers of exactly five. *Secret:* the window table with the covered birdcage is wiped and set before any customer arrives, and no one ever sits there but one old regular — the seat is *kept*, a standing courtesy the whole town honors without a sign or a word.
7. **阿九 Ā Jiǔ — A-Jiu**, the tea house boy, about fourteen. *Look:* a skinny attentive boy with sleeve-guards to his elbows, feeding twigs to the stove fire and hauling the big brass kettle two-handed. *Tell:* a cloth knot-button missing at his collar, always the same one. *Secret:* tucked behind the stove woodpile is a slate with rows of clumsy chalk characters, wiped and rewritten — he is teaching himself, copying what he glimpses through the schoolroom's open door on kettle-water errands.
8. **覃师傅 Qín Shīfu — Master Qin**, the indigo dyer. *Look:* a lean quiet man, forearms stained deep blue to the shoulder, folding wet cloth with slow exact motions. *Tell:* the permanent blue hands — visible across a whole street. *Secret:* the child-sized length on the clean rack is his finest, evenest blue, better than anything on the sale frames — dye work traded against mill flour, for the miller's flour is traded against the stall's noodles, and somewhere in that circle nobody has touched a coin. The cloth is for Xiaoman's school jacket.
9. **麻二 Má Èr — Ma Er**, the miller. *Look:* a big slow-moving young man, hair and eyebrows white with flour, hefting sacks like pillows. *Tell:* he leaves one clean handprint on each sack he's checked. *Secret:* by the mill door sits a small marked sack, set apart — flour ground fine, the grade for an old woman's cooking — and the same mark shows on a sack already in the great-aunt's kitchen. The town has been carrying her household for a while; Wanqing's arrival is relief arriving.
10. **宋先生 Sòng Xiānsheng — Teacher Song**, the schoolmaster. *Look:* a thin man in a mended long gown, ink-stained fingers, moving between benches setting each one straight. *Tell:* his gown's neat visible mends — poverty carried with total dignity. *Secret:* the covered noodle bowl from the stall arrives on his desk while the player watches the beats unfold; he never eats it in view of the street. Pride and gratitude in one prop.
11. **吴婆婆 Wú Pópo — Granny Wu**, the herbalist. *Look:* a tiny bright-eyed old woman behind a counter of a hundred small drawers, weighing herbs with hand scales. *Tell:* she taps each drawer twice before opening it. *Secret:* a paper packet on her counter is already tied and set aside, written over with nothing (no readable text — but marked with a brushed circle the player will see again): the same circle-mark is on a packet in the great-aunt's kitchen. Standing weekly medicine, prepared before it's asked for.
12. **杨木匠 Yáng Mùjiàng — Yang the Carpenter**, boat-mender. *Look:* a compact weathered man kneeling on the dock stones over a beached sampan, mouth full of bamboo pegs, mallet in hand. *Tell:* a curl of pale wood shaving always caught somewhere on his clothes. *Secret:* the sampan he is mending is not Chen's working ferry — it is a second boat being made sound, and a new sculling oar with an unweathered blade already leans against the waiting shed. The town is readying a boat it will soon need: a household with a young pair of hands in it again has errands across the water.
13. **豆豆 Dòudou — Doudou**, Auntie Luo's grandson, about five. *Look:* a round small boy in a red-trimmed jacket pursuing a grey cat with total dedication, always three steps behind it. *Tell:* one shoe perpetually half off. *Secret:* his chalk scribbles on the workshop's back-yard wall are circles within circles — child's copies of lantern frames. Third generation of the craft, aged five, already drawing the family trade.

---

## 6. Narrative beats — the morning's story, in exploration order

There is no quest log, no fetch, no combat, no failure. The story is a **web of quiet kindnesses converging on Wanqing's arrival**, and it is told entirely in props, positions, and one or two small events the player can happen to witness. A player who wanders well assembles it; a player who doesn't still has a beautiful morning. Beats are ordered by the natural exploration gradient (spawn outward), grouped early / mid / late morning; Alice uses the `beats` array in the JSON to bias which new paths to seed as the graph grows.

**Early morning (near spawn):**
1. **The set-aside bowl** *(street)* — at the noodle stall, one covered bowl sits apart on the end board. First thread: someone in this town is fed without asking.
2. **The kept table** *(tea house)* — the window table is wiped, set, and empty, birdcage covered beside it. Second thread: this town keeps places for people.
3. **The unpapered lantern** *(lantern workshop)* — on Luo's bench, apart from the red rows: a small fresh frame, household-red paper laid ready, no buyer in sight. A lantern with no household — yet.

**Mid morning (across the water, down the lanes):**
4. **Two bowls, one hut** *(dock)* — Chen's hut: two washed bowls, one bed. And Yang mending a *second* boat, a new oar already made. The dock is preparing for more crossings than one old man makes.
5. **The balcony basket** *(stilt-house walk)* — Xiaoman's laundry balcony holds a ready school carrying-basket; her one new-blue sleeve matches nothing else she wears.
6. **The circle of trades** *(dye yard + mill)* — Qin's flawless child-sized blue on the clean rack; Ma Er's set-apart fine-flour sack by the mill door. Flour for dye, dye for a school jacket, noodles for lessons — the town's barter of favors becomes visible as a *circle*.
7. **The bowl arrives** *(school house)* — the covered bowl from beat 1 now sits on Teacher Song's desk, still faintly steaming; the row of children's baskets by the door has room for one more. Threads 1, 5, and 6 tie themselves.

**Late morning (home, and the return):**
8. **The gate fish** *(well lane → courtyard gate)* — a wrapped river fish hangs on the great-aunt's black gate, tied with green cord — the same green cord as the basket by Chen's hut. If the player is at the well court at the right beat, they see it happen: Chen setting the fish on the gate handle and walking away without knocking.
9. **The altar and the little boat** *(courtyard, altar room)* — fresh tea, two oranges, a portrait, and a carved model of the ferry at the dock. The house's grief, kept gently; Chen's fish, Chen's two bowls, and the great-aunt's altar resolve into one old friendship. This is the story's quiet center, and it is never spoken.
10. **Two bowls, one kitchen** *(courtyard kitchen)* — the kitchen table is set for two, one pair of chopsticks still paper-wrapped. The mirror of beat 4, and the morning's answer: the town made room. She lives here now.
11. **The lantern goes home** *(late; lantern workshop or well lane)* — the small lantern's frame is now papered household-red and gone from the bench; if the player returns late by the well lane, it hangs new and unlit above the great-aunt's gate, the fish gone in to the kitchen. The town has counted its newest member in the only ledger it keeps: a lantern on an eave, waiting for evening.
12. **The mist lifts** *(any return to the spawn street, late)* — the steam column has customers around it, door-boards are fully down, the far end of the street has emerged from the white, and the lanterns hang in plain sun, unlit, waiting. The morning is over; the town is awake; so is she.

---

## 7. Rules for new video prompts (Alice: apply to every seeded path)

These extend, and never override, the plan's errata (`--quality extra-fast`, retry-once, SSIM flag, clip-QA gate) and the §2.1 character lock, which is still prepended verbatim to every prompt.

1. **Feet on wood, stone, or packed earth — never water.** Wanqing never boards a boat, never stands in the shallows, never steps on stones *in* the river. Docks, boardwalks, bridges, millrace paths, stairs, thresholds: yes. The river is scenery, always below or beside her. If an action can't be done from solid ground, it isn't a clip.
2. **Into-building paths are the premium content.** Prefer journeys that cross a threshold: through a door, under an awning, up a staircase, into a loft. A threshold crossing should *read* — the light changes (street-grey to interior-warm, or the reverse), and she ducks, steps over a high sill, or brushes under something hanging. Interiors are where the story props live; the graph should keep offering ways *in*.
3. **Look shots end in close-up** (errata #20). A `look` journey is approach + settle: she moves the last step toward the object and the final frame is the object filling most of the frame (her hands or profile may edge in). If the last frame is still a wide street, the clip fails goal-QA. The close-up last frame becomes the next still, so make it a *rich* close-up — the beat props of §6 are exactly what look-shot close-ups are for.
4. **People-in-town experiment: ON.** Roster characters may appear in journey clips at their stations, doing their one action (Luo ribbing a frame, Tian ladling, Yang pegging a plank, Xiaoman pinning laundry, Doudou losing to the cat). Keep them mid-ground or background, doing — never reacting to camera, never mouthing words (silent v1), never blocking her path. One roster character per clip is the default; two only when their stations truly overlap (dock: Chen + Yang). Faces stay consistent with the roster look lines; if H3 drifts a face badly, that's a reject like any continuity error.
5. **Six-second grammar.** One journey = one movement sentence: depart, travel, arrive-and-settle, in ~6 s. No cuts, no camera moves she doesn't motivate by walking or turning. She ends settled (stopped, or hand on rail/frame/jamb) so the last frame is a stable, clickable still.
6. **Morning, mist, unlit — always.** Every clip is the same misty autumn morning. Lanterns are never lit, shadows are never long, rain never falls (wet surfaces, yes; rain, no). Late-morning beats brighten the mist; they do not clear the sky to blue.
7. **Keep the motif palette in frame** (§4). Any given clip should carry at least two motifs naturally — steam past a doorway, a laundry pole overhead, the green river through stilt legs. This is what makes chained clips feel like one town.
8. **No readable text, ever** (locked). Signs, slates, sacks, packets: shapes and ghosts only. QA rejects legible characters in any language.
9. **Respect the culture like a documentary would.** Props and actions stay period-plausible western-Hunan: shoulder-poles, hand scales, mud-brick stoves, bamboo everything. The altar room is filmed the way the kitchen is — a fact of the house, quiet and dignified. Nothing exoticized, nothing played for whimsy.
10. **Journeys go through, not at.** A seeded `walk`/`enter` path should advance the player's position in the town graph (§2 adjacency), preferably revealing the *next* district's edge in its final frame (the bridge mouth at the street's end; the dye-yard's blue through the last stilt legs). Dead-end camera pushes with no arrival are look-shots' job, and even look shots arrive — at a close-up.

---

## 8. Hands on the world — `interact` journeys *(new law, locked)*

*(Canon source: `docs/object-interactions.md`; this section folds it into the bible. `interact` joins `walk` / `enter` / `look` in the manifest `kind` vocabulary of §2, and the machine copies live in `town-lore.json` — both inside each district's `journeys` array and in the flat top-level `interactions` array Alice reads when seeding.)*

Wanqing does not only walk. When the player taps an object, she **uses her hands — or leans in with her face — on that object**. The clip *is* the interaction, and it carries the same weight as journeys and enter-building paths.

**The law (QA-enforced):**

1. **The tap target is the object**, not a nearby path. She must **touch / smell / pull / ring / lift / knock** that object with her hands or face. Walking past it — or stopping beside it with her hands at her sides — is a **fail**.
2. **The last frame shows the result.** The object has changed, or fills the shot: curtain drawn aside and the doorway revealed, bell still swinging, steam of rice in her face. The last frame becomes the next clickable still, so the result must *read* in one frame.
3. **Clips may invent what the walk earns.** If she enters a kitchen, there can be a stove, food cooking, and a cook. New objects, rooms, and characters are how the town grows. Do not drop a random extra building into the *same* wide still with no travel (that's still a fail). Feet on wood, stone, or packed earth — never water (§7.1). Six-second grammar (§7.5). Morning, mist, lanterns unlit (§7.6). Altar room: threshold look only (§7.9).
4. **Every still should offer at least one interact** if a catalog-plausible object is actually in the painting. Objects must be plausible in the room they're tapped in — a ladle at a cauldron, an abacus on a counter, never the reverse.

**Gold standard — already in the game: smell the rice** *(street, noodle stall)*. She leans down into the steam of a fresh bowl and breathes it in; the last frame is a close-up of the rice, steam curling past her face at the frame's edge. Every interact clip is measured against this: object engaged with the body, result legible in the final frame.

**H3 ACTION pattern (verbatim from the catalog):**

```
She steps to the [object] and [verb] it with her hands.
Camera eases in. Last frame is a close-up of the [object] after the action
([result]). Same clothes, same Ghibli paint. Do not walk away from it.
If the object is not in the first frame, entering or walking may bring it into existence.
```

### Interact journeys by district

These extend each district's Journeys list in §2 (they do not replace anything). Format: object → what she does → **last frame**.

**8.1 石板老街 Flagstone Old Street** *(§2.1)*
- *Interact — smell the rice (gold standard):* a fresh steaming bowl on the stall's end board → she plants her hands either side of it and leans her face down into the rising steam, eyes closing as she breathes in → **close-up of glistening rice noodles and broth, steam curling past her nose and chin at the frame's edge.**
- *Interact — dip the ladle:* the long-handled ladle in the stall cauldron → she lifts it slowly, broth streaming back, the twist of dried chili swinging on its handle → **close-up of the full ladle over the cauldron, broth steaming, chili twist mid-sway.**
- *Interact — click the abacus:* the worn abacus on the general store counter → she reaches out one finger and clicks a single bead across → **close-up of the abacus, one bead apart from its row, her fingertip just leaving the frame.**
- *Interact — tilt the umbrella:* the paper umbrella drying against the wall → she takes its shaft and tilts it toward her, studying the beads of mist on its ribs → **close-up of the oil-paper canopy at a new angle, mist beads sliding along a bamboo rib.**

**8.2 老茶馆 The Old Tea House** *(§2.2)*
- *Interact — lift the bowl lid:* a lidded tea bowl on a set table → she lifts the lid a hand's width and tilts it, steam escaping → **close-up of the open bowl, tea leaves unfurling, steam rising past the tilted lid in her fingers.**
- *Interact — pour from the kettle:* the great brass kettle on the clay stove → she wraps the handle with the folded grey cloth and tips it, pouring hot water into a waiting bowl → **close-up of the arc of steaming water meeting the bowl, the dented brass flank glowing.**
- *Interact — open the shutter:* the half-closed shutter of the upstairs river room window → she pushes it fully open with one hand flat on the wood → **the window filled with green river and white mist, the shutter swung wide, her hand still on its edge.**

**8.3 拱月桥 Arched Moon Bridge** *(§2.3)*
- *Interact — hands on the rail:* the worn mid-span rail → she leans her weight onto both hands on the wet wood, feet planted on the planks → **close-up of her two hands on the rain-dark rail, the green river sliding below.**
- *Interact — steady the lantern:* a low-hung unlit lantern at the bridge mouth, swaying in the draft → she cups it gently in both hands until it stills → **the lantern filling the frame between her palms, red paper faintly glowing with the grey daylight behind it.**

**8.4 吊脚楼水巷 Stilt-House Waterside Walk** *(§2.4)*
- *Interact — stroke the cat:* the sleeping cat on the warm windowsill → she crouches and lays one slow hand on its flank; it stretches without waking → **close-up of the cat and her hand, one paw uncurled, whiskers stirring.**
- *Interact — finger the chili string:* a hanging string of drying chilies under the eave → she reaches up and runs the string through her fingers, setting it gently swaying → **the red chilies filling the frame, still swinging against the grey wood.**
- *Interact — brush the wind chime:* a bamboo wind chime hung under a stilt-house eave → she reaches up and brushes it with her fingertips; it clacks softly → **close-up of the bamboo tubes still knocking and turning, mist behind them.**
- *Interact — pin the laundry:* a slipped indigo jacket on the balcony line → she re-pins it with the wooden peg from the rail → **close-up of the jacket hanging square again, her hand leaving the peg, drips falling.**

**8.5 老码头 Old Ferry Dock** *(§2.5)*
- *Interact — ring the ferry bell:* the small bronze bell on its post at the head of the dock steps, hung to call the ferry through the mist → she reaches out and taps it once with two fingers; it rings → **the bell still swinging on its bracket, the mist-white river behind it.**
- *Interact — test the mooring rope:* the wet coiled rope on the stone mooring post → she takes the knot in both hands and gives it one firm testing pull → **close-up of the taut knot on the rope-grooved post, water squeezed dark from its fibers.**
- *Interact — trace the flood marks:* the old high-water scratches on the waiting-shed wall → she lays her fingertips in the deepest groove and draws them slowly along it → **close-up of her fingers in the scored timber, decades of marks fanning around them.**

**8.6 灯笼铺 The Lantern Workshop** *(§2.6)*
- *Interact — cup the lantern:* the lowest hanging lantern at the storefront → she lifts it lightly from beneath with both hands, feeling its papery weight → **the lantern filling the frame in her palms, ribs shadowed through the red paper.**
- *Interact — touch the curing paper:* a dry curing lantern in the drying loft → she lays one palm flat and featherlight against its side, window light glowing through → **close-up of her hand silhouetted through the pale paper, ribs like leaf-veins around it.**
- *Interact — lift the soaking cane:* a bamboo cane in the stone trough of the back yard → she lifts one end a hand's width and lets it slip back with a soft plash → **close-up of the trough, rings spreading from the settling cane, split canes leaning behind.**

**8.7 井巷 Well Lane** *(§2.7)*
- *Interact — pull the curtain:* the cloth curtain of the herb drying room → she takes its edge and draws it aside → **the doorway revealed, racks of cut roots and hanging leaves in the dimness beyond, the curtain bunched in her hand.**
- *Interact — lift the bucket:* the full wooden bucket beside the well → she takes the handle in both hands and lifts it a hand's width, water trembling → **close-up of the bucket's brimming rim, ring-ripples in the dark water, the rope-grooved well lip behind.**
- *Interact — smell the herb bundle:* a bundle of drying plants under the herb shop's eave → she cradles it in one hand and leans her face in, breathing the bittersweet smell → **close-up of the dried leaves and stems near her face, dust motes drifting off the bundle.**

**8.8 姑婆的院子 Great-Aunt's Courtyard** *(§2.8)*
- *Interact — knock at the black gate:* the black-lacquered gate leaf → still a guest in her own gate, she knocks twice with her knuckles and waits → **the gate from her side, filling the frame, one leaf just cracking inward.**
- *Interact — touch the persimmon trunk:* the persimmon tree in the courtyard → she lays her palm on the trunk once, exactly as her great-aunt does crossing the court → **close-up of her hand on the grey lichened bark, an orange fruit soft-focus above.**
- *Interact — lift the pot lid:* the pot breathing on the mud-brick stove → she lifts the wooden lid and leans into the escaping steam of cooking rice → **close-up of the white rice and rolling steam, her face at the frame's edge, eyes closed.**
- *Interact — dip the gourd ladle:* the big water jar under the persimmon tree → she slides its wooden lid aside and dips the gourd ladle, lifting it brimming → **close-up of the full gourd ladle over the jar's dark water, one drip falling back.**
- *(Never the altar. The altar room stays a threshold `look` only — §7.9.)*

**8.9 水磨坊 The Water Mill** *(§2.9)*
- *Interact — set the scale swinging:* the hanging steelyard scale in the grain loft → she touches its brass weight with one finger and sets it gently swaying → **close-up of the steelyard still swinging on its beam hook, dust motes wheeling in the window light.**
- *Interact — run the grain:* an open sack of unmilled grain → she dips one hand and lets the grain pour back through her fingers → **close-up of the grain streaming from her hand into the sack, husks catching the light.**
- *Interact — feel the beam:* the shuddering timber frame of the grinding works → she lays her palm flat on the great beam and holds it there, feeling the mill's heartbeat → **close-up of her steady hand on the trembling flour-dusted wood.**

**8.10 学堂 The School House** *(§2.10)*
- *Interact — click the school abacus:* the boy-sized abacus on the front bench → she bends and clicks one small bead across with a fingertip → **close-up of the little abacus, one bead moved, the ghost-wiped slate soft behind it.**
- *Interact — right the basket:* a tipped carrying-basket in the row by the schoolroom door → she crouches and sets it upright, square with its neighbors → **close-up of the little basket standing straight in the row, her hands just letting go.**

**8.11 染坊 The Indigo Dye Yard** *(§2.11)*
- *Interact — shift the vat lid:* a heavy wooden vat lid in the vat shed → she slides it a hand's width aside and leans over the opening, the sharp indigo smell rising → **close-up of the vat's deep blue-black surface, her face reflected faint at the frame's edge.**
- *Interact — heft the stirring pole:* a long stirring pole leaning at a splash-stained post → she takes it in both hands and lifts it upright, feeling its dye-dark weight, then leans it back → **close-up of the pole's blue-crusted end against the post, her hands steadying it.**
- *Interact — still the cloth:* a near-dry pale length swaying on its drying frame → she stills it with the backs of her fingers, careful of the dye → **close-up of the calmed cloth, sky-wash blue, the backs of her fingers just lifting away.**
