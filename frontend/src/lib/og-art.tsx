// Ice cream tub drawn with plain boxes, because the share image renderer supports a small CSS subset.
export function OgTub() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 320 }}>
      <div style={{ display: "flex", alignItems: "flex-end", marginBottom: -36 }}>
        <div style={{ width: 120, height: 120, borderRadius: 999, background: "#f59ab5", marginRight: -26 }} />
        <div style={{ width: 140, height: 140, borderRadius: 999, background: "#6b3a24", marginBottom: 30, zIndex: 2 }} />
        <div style={{ width: 120, height: 120, borderRadius: 999, background: "#fbe9b7", marginLeft: -26 }} />
      </div>
      <div style={{ display: "flex", width: 300, height: 36, borderRadius: 18, background: "#9e1f4e" }} />
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          width: 260, height: 190, background: "#b02a58", borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "white", borderRadius: 16, padding: "12px 26px" }}>
          <div style={{ fontSize: 30, color: "#b02a58", letterSpacing: 4 }}>DESIRED</div>
          <div style={{ fontSize: 16, color: "#6b4a3a", letterSpacing: 3 }}>ICE CREAM</div>
        </div>
      </div>
    </div>
  );
}
