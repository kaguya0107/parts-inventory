export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Run on routes except login, uploads API (handles auth internally), Next internals & static assets.
     */
    "/((?!login|api/uploads|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
