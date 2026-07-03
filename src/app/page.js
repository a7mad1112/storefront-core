export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "var(--space-4)",
        padding: "var(--space-8)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "var(--font-size-4xl)",
          fontWeight: "var(--font-weight-extrabold)",
          background: "linear-gradient(135deg, var(--color-accent), #ff6b8a)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        GB Store
      </h1>
      <p
        style={{
          fontSize: "var(--font-size-lg)",
          color: "var(--color-text-secondary)",
          maxWidth: "500px",
        }}
      >
        متجر الهدايا والاكسسوارات — قريباً
      </p>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-4)",
          background: "var(--color-accent-soft)",
          borderRadius: "var(--radius-full)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-accent-hover)",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--color-success)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        Phase 1 — Foundation ✅
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
