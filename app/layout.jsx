import './globals.css';
import './terminal.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import Navigation from '../components/Navigation';
import Providers from '../components/Providers';

export const metadata = { title: 'SHYPE — Solana Interface', description: 'SHYPE Solana interface.' };

export default function RootLayout({ children }) {
  return <html lang="en"><body><Providers><Navigation /><main className="appFrame">{children}</main></Providers></body></html>;
}
