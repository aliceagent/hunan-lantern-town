/**
 * Shared art for the generated app icons (app/icon.tsx, app/apple-icon.tsx):
 * a river lantern glowing on black, drawn with plain boxes and gradients.
 * No text — the og renderer's built-in font has no CJK glyphs, so 灯 would
 * rasterize as tofu.
 */
export function LanternIcon({ size }: { size: number }) {
  const s = (n: number) => (n * size) / 180;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
      }}
    >
      <div style={{ width: s(3), height: s(14), background: "#78350f" }} />
      <div style={{ width: s(44), height: s(10), background: "#7c2d12", borderRadius: s(3) }} />
      <div
        style={{
          width: s(96),
          height: s(84),
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 42%, #fde68a 0%, #f59e0b 45%, #b45309 75%, #7c2d12 100%)",
          boxShadow: `0 0 ${s(36)}px ${s(10)}px rgba(245, 158, 11, 0.45)`,
        }}
      />
      <div style={{ width: s(28), height: s(8), background: "#7c2d12", borderRadius: s(3), marginTop: s(2) }} />
      <div style={{ width: s(4), height: s(14), background: "#b45309" }} />
    </div>
  );
}
