import './globals.css';
import Navigation from '../components/Navigation';
import Providers from '../components/Providers';

export const metadata = {
  title: 'SHYPE — Solana Interface',
  description: 'A clean Solana interface for swaps, external perps routing, launches, stake-to-support and fee routing.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          <main className="appFrame">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
