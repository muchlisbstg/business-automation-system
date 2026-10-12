import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#090c13", color: "#e8f0fa", fontFamily: "system-ui, sans-serif" }}>
      <section style={{ width: "min(420px, 100%)", padding: 32, border: "1px solid #292f40", borderRadius: 16, background: "#10141f" }}>
        <p style={{ color: "#4785fa", fontWeight: 700, letterSpacing: ".12em", fontSize: 12 }}>NEXUS AI</p>
        <h1 style={{ marginBottom: 8 }}>Sign in securely</h1>
        <p style={{ color: "#8796b0", lineHeight: 1.6 }}>Use your organization’s identity provider. Team and repository permissions are assigned by application administrators.</p>
        <form action={async () => { "use server"; await signIn("corp-sso", { redirectTo: "/" }); }}>
          <button type="submit" style={{ width: "100%", padding: 12, border: 0, borderRadius: 8, background: "#4785fa", color: "white", fontWeight: 700, cursor: "pointer" }}>Continue with company SSO</button>
        </form>
        <p style={{ color: "#8796b0", fontSize: 12, marginTop: 18 }}>SSO must be configured by an administrator before access is enabled.</p>
      </section>
    </main>
  );
}
