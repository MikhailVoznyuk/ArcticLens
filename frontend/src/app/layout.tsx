import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GIS Demo MVP',
  description: 'Leaflet demo for local GIS bundle preview',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
