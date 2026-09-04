# 河灯小镇 / Lantern River Town

A click-to-explore video town. Every click plays a real, MiniMax-H3-generated
video clip, chained from the last frame of whatever clip played before it —
so the town keeps flowing, one shot into the next, as you wander through it.
The very first frame you see is a locked, Ghibli-style still that anchors the
whole scene.

Online play is **cache-only**: only edges that have already been generated
and approved are playable. There's no live generation in the browser — you're
exploring a fixed graph of pre-rendered clips, not an open-ended world.

## How to run

```bash
npm install
npm run dev
```

Then open the local dev URL printed in your terminal.

## About the data

`public/manifest.json` and `public/media` are committed build artifacts. They
are produced on the authoring machine by `scripts/build-manifest.mjs` and
checked in so the app can run standalone, without regenerating any video.

## License

MIT — see [LICENSE](./LICENSE).
