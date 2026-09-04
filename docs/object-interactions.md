# Hands on the world — tactile interactions

Wanqing does not only walk. When the player taps a thing, she **uses her hands (or her face) on it**. The clip is the interaction. Last frame should show the result.

These beats belong in the town bible (`docs/town-lore.md` + `town-lore.json`) as `kind: interact`. They are as important as journeys and enter-building.

## Law

- The tap target **is the object**, not a nearby path.
- She must **touch / smell / pull / ring** that object. Walking past it is a fail.
- Last frame: the object **changed or filling the shot** (curtain open, bell still swaying, steam of rice in her face).
- Feet stay on wood, stone, or dirt. Never water.
- 6s extra-fast H3, 1024×576. Ghibli. Same clothes. Whole figure until a look/interact close-up.
- Clips **may introduce** new objects, rooms, and people when that is the logical next beat. Example: she walks through a doorway into a kitchen — stove, cooking food, and a cook can appear. New items and characters are how the world grows. Do not drop random extra buildings into the *same* wide still with no travel (no house in the river).

## Catalog (seed these; add more per still)

| id | object | she does | last frame |
|---|---|---|---|
| smell-rice | steaming rice / noodles | leans in, breathes it in | close-up of rice + steam, her face near |
| ring-bell | shop / ferry / door bell | reaches, flicks or taps it | bell swinging, we hear it ring |
| pull-curtain | cloth door curtain | takes the edge, draws it aside | doorway revealed, curtain bunched |
| lift-lantern | unlit paper lantern | both hands lift or steady it | lantern filling frame, paper glow |
| knock-door | wooden door | knocks twice, waits | door from her side, maybe a crack |
| dip-ladle | stall cauldron | lifts ladle, steam | broth close-up |
| stroke-cat | sleeping cat | crouches, one hand | cat + her hand |
| touch-rail | bridge rail | leans, both hands on wet wood | river below, her hands on rail |
| open-shutter | window shutter | pushes it open | interior light / river view |
| pour-tea | tea bowl | lifts lid or pours | steam, bowl close-up |
| wind-chime | bamboo chime | brushes it | chime still moving |
| chili-string | hanging peppers | fingers the string | peppers filling frame |
| umbrella-rib | paper umbrella | tilts it, looks at beads of mist | umbrella close-up |
| rope-mooring | dock rope | tests the knot | rope + post close-up |
| abacus | shop counter | one click of a bead | abacus close-up |

Smell-the-rice is the gold standard. Every still should try to offer **at least one** interact. If the object is not painted yet, the clip can walk her into the room where it belongs.

## H3 ACTION pattern

```
She steps to the [object] and [verb] it with her hands.
Camera eases in. Last frame is a close-up of the [object] after the action
([result]). Same clothes, same Ghibli paint. Do not walk away from it.
If the object is not in the first frame, the walk or enter may bring it into existence.
```
