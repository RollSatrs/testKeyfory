export function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(90deg, #77C3FD, #6D7CFD, #B3AAFC)",
        backgroundSize: "200% 200%",
        animation: "gradientMove 6s ease-in-out infinite",
      }}
    >
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      <div
        className="rounded-4xl shadow-lg p-16 w-full max-w-md"
        style={{
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        {children}
      </div>
    </div>
  );
}