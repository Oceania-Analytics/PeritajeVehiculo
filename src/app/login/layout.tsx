import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión — OceanIA Peritaje',
  description: 'Accede al sistema de peritaje inteligente de vehículos.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The login page has its own full-screen layout — no navbar, no container
  return <>{children}</>;
}
