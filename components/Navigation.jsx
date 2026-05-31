"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const logoUrl = 'https://raw.githubusercontent.com/airscentes-del/shype/main/IMG_2365.png';
const items = [
  ['/', 'Home'],
  ['/swap', 'Swap'],
  ['/perps', 'Perps'],
  ['/stake', 'Stake'],
  ['/launch', 'Launch'],
  ['/vault', 'Vault']
];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <header className="appHeader">
      <Link className="brand" href="/">
        <img src={logoUrl} alt="SHYPE" />
        <span>SHYPE</span>
      </Link>
      <nav className="navRail">
        {items.map(([href, label]) => <Link key={href} className={pathname === href ? 'active' : ''} href={href}>{label}</Link>)}
      </nav>
      <WalletMultiButton className="walletButton" />
    </header>
  );
}
