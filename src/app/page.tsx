import Link from "next/link";

export default function Home() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ background: 'var(--accent-color)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
          OceanIA InsureTech
        </span>
      </div>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-montserrat)' }} className="text-gradient">
        Peritaje Inteligente de Vehículos
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', lineHeight: '1.6' }}>
        Evalúa automáticamente los daños de cualquier vehículo utilizando agentes autónomos y nuestra avanzada tecnología de visión (YOLO + VLM). Obtén un informe detallado en segundos.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/peritaje" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', textDecoration: 'none', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          Iniciar Evaluación Agéntica <span>→</span>
        </Link>
        <Link href="/demo" className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', textDecoration: 'none', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          Ver Suite de Demo <span>✨</span>
        </Link>
      </div>
    </div>
  );
}
