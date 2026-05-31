"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [['/', 'Overview'], ['/swap', 'Swap'], ['/perps', 'Perps'], ['/stake', 'Stake'], ['/launch', 'Launch'], ['/vault', 'Vault']];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <header className="appHeader">
      <Link className="brand" href="/">
        <img src="/IMG_2365.png" alt="SHYPE" />
        <span>SHYPE</span>
      </Link>
      <nav className="navRail">
        {items.map(([href, label]) => <Link key={href} className={pathname === href ? 'active' : ''} href={href}>{label}</Link>)}
      </nav>
      <button className="walletButton" type="button">Connect wallet</button>
    </header>
  );
}
