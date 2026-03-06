'use client';
import Link from 'next/link';
import Image from 'next/image';

export function AuthRight() {
  return (
    <div className="auth-right" style={{ 
      padding: 0, 
      overflow: 'hidden', 
      position: 'relative',
      margin: '16px 16px 16px 0',
      borderRadius: '24px',
    }}>
      <Image
        src="/login.webp"
        alt="AIRO"
        fill
        priority
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
    </div>
  );
}

export function AiroLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Image
        src="/airo-logo.png"
        alt="AIRO"
        width={52}
        height={52}
        priority
        style={{ objectFit: 'contain' }}
      />
      <span style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 900,
        fontSize: '26px',
        letterSpacing: '-0.5px',
        color: '#0d0d14',
      }}>
        AIR<span style={{ color: '#6c47ff' }}>O</span>
      </span>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-scene" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="auth-left" style={{ padding: '60px 60px 60px 72px' }}>
        {/* Logo at top */}
        <Link href="/login" style={{
          position: 'absolute', top: 36, left: 72,
          textDecoration: 'none', display: 'inline-block',
        }}>
          <AiroLogo />
        </Link>
        {/* Push children down so they don't collide with logo */}
        <div style={{ marginTop: 60 }}>
          {children}
        </div>
      </div>
      <AuthRight />
    </div>
  );
}