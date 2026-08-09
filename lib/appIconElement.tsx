export function AppIconElement({ size }: { size: number }) {
  const ring = Math.round(size * 0.14);
  const innerDiameter = Math.round(size * 0.62);
  const dot = Math.round(size * 0.14);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #5f5ef5, #22d3ee)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: innerDiameter,
          height: innerDiameter,
          borderRadius: "50%",
          border: `${ring}px solid white`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: dot, height: dot, background: "white", transform: "rotate(45deg)" }} />
      </div>
    </div>
  );
}
