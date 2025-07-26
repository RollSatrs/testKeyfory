import { Layout, Card } from "antd";

export function AuthLayout({ children }) {
  return (
    <Layout
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
      <Card
        bordered={false}
        style={{
          borderRadius: 32,
          boxShadow: "0 8px 32px rgba(99,117,240,0.15)",
          padding: 32,
          maxWidth: 400,
          width: "100%",
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        {children}
      </Card>
    </Layout>
  );
}