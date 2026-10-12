import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXUS AI | Engineering Control Plane',
  description: 'Enterprise dashboard for engineering projects, repositories, AI agent oversight, CI health, and human approvals.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
