import './globals.css';

export const metadata = {
  title: 'Airtel Nexus — care console and customer app',
  description:
    'A working demo of the Airtel customer app and the care console behind it, with AI Next Best Action and a geocentric campaign studio.',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#14171f' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
