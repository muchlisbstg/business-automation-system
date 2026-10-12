import NextAuth from "next-auth";

/**
 * Configure AUTH_OIDC_ISSUER / CLIENT_ID / CLIENT_SECRET with the organization's
 * trusted OIDC identity provider. Roles are never accepted from IdP claims:
 * application permissions are loaded from PostgreSQL on each protected request.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [{
    id: "corp-sso",
    name: "Corporate SSO",
    type: "oidc",
    issuer: process.env.AUTH_OIDC_ISSUER ?? "https://sso-not-configured.invalid",
    clientId: process.env.AUTH_OIDC_CLIENT_ID ?? "not-configured",
    clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET ?? "not-configured",
    checks: ["pkce", "state"],
  }],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
