import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getSession } from "@/lib/session";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "OceanIA Peritaje",
  description: "Sistema web de peritaje de vehículos con IA",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read session server-side to render user info in the navbar
  const session = await getSession();

  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        {/* Only show the navbar if the user is authenticated */}
        {session && (
          <nav className="navbar">
            <Link href="/" className="navbar-brand text-gradient">
              OceanIA Peritaje
            </Link>
            <div className="nav-links">
              <Link href="/" className="nav-link">Inicio</Link>
              <Link href="/peritaje" className="nav-link">Peritaje Básico</Link>
              <Link href="/comparativa" className="nav-link">Fraude (Antes/Después)</Link>
              <Link href="/demo" className="nav-link">Suite de Demo</Link>

              {/* User badge */}
              <span className="nav-user-badge" aria-label={`Usuario: ${session.userId}`}>
                <span aria-hidden="true">👤</span> {session.userId}
              </span>

              {/* Logout — uses a Server Action via form */}
              <form action={logout} style={{ margin: 0, padding: 0 }}>
                <button
                  id="logout-btn"
                  type="submit"
                  className="btn-logout nav-link"
                  aria-label="Cerrar sesión"
                >
                  <span aria-hidden="true">🚪</span> Salir
                </button>
              </form>
            </div>
          </nav>
        )}
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
