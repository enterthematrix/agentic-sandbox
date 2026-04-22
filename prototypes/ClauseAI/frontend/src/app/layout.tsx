import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClauseAI - Legal Document Assistant',
  description: 'AI-powered legal document generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
