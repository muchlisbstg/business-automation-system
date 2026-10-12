import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const signedIn = Boolean(request.auth?.user?.id);
  const isLogin = request.nextUrl.pathname === "/login";
  if (!signedIn && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (signedIn && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/", "/login"] };
