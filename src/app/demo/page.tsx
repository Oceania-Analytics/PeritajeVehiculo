"use client";

import { useEffect, useState, useRef } from "react";
import { AgenticReport } from "@/types";

function DemoCard({ id, url, type, startExecution }: { id: string, url: string, type: 'damaged' | 'undamaged', startExecution: boolean }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AgenticReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasExecuted = useRef(false);

  useEffect(() => {
    if (startExecution && !hasExecuted.current && !report && !loading) {
      hasExecuted.current = true;
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startExecution]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const imgRes = await fetch(url);
      if (!imgRes.ok) throw new Error("Error cargando imagen.");
      const blob = await imgRes.blob();
      const file = new File([blob], `${id}.jpg`, { type: blob.type });

      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Error en la IA");
      }

      const result = await response.json();
      setReport(result.data.report);
    } catch (err: unknown) {
      let errorMessage = "Error desconocido";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="glass-panel animate-fade-in"
      style={{ 
        padding: '1.5rem', 
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
          Caso {id.split('_')[1]}
        </span>
        <span style={{ 
          fontSize: '0.8rem', 
          padding: '0.3rem 0.8rem', 
          borderRadius: '20px',
          backgroundColor: type === 'damaged' ? '#fee2e2' : '#dcfce7',
          color: type === 'damaged' ? '#991b1b' : '#166534'
        }}>
          {type === 'damaged' ? 'Siniestro' : 'Buen Estado'}
        </span>
      </div>

      <div style={{ 
        width: '100%', 
        height: '220px', 
        borderRadius: '12px', 
        overflow: 'hidden',
        backgroundColor: 'var(--glass-bg)',
        position: 'relative',
        border: '1px solid var(--glass-border)'
      }}>
        <img 
          src={url} 
          alt={`Demo Case ${id}`} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', animation: 'pulse 1.5s infinite' }}>🤖</div>
          </div>
        )}

        {report?.desperfectos?.map((desperfecto, idx) => {
          const [x1, y1, x2, y2] = desperfecto.box_norm;
          return (
            <div
              key={idx}
              className="damage-box"
              style={{
                left: `${x1 * 100}%`,
                top: `${y1 * 100}%`,
                width: `${(x2 - x1) * 100}%`,
                height: `${(y2 - y1) * 100}%`,
              }}
            >
              <div className="damage-tooltip">
                ⚠️ {desperfecto.descripcion}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #fca5a5' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: report.requiere_peritaje_humano ? '#fef2f2' : '#ecfdf5', border: `1px solid ${report.requiere_peritaje_humano ? 'var(--danger)' : 'var(--success)'}`, textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: report.requiere_peritaje_humano ? 'var(--danger)' : 'var(--success)' }}>
              {report.requiere_peritaje_humano ? 'Requiere Informe Humano' : 'Sin Daños Graves'}
            </span>
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <strong>Confiabilidad:</strong> 
            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{report.confiabilidad_porcentaje}%</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', maxHeight: '120px', overflowY: 'auto', background: 'var(--glass-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {report.resumen_veredicto}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoGalleryPage() {
  const [images, setImages] = useState<{ id: string; url: string; type: 'damaged' | 'undamaged' }[]>([]);
  const [executingAll, setExecutingAll] = useState(false);

  useEffect(() => {
    // Generate the array of 12 demo images
    const newImages = [];
    for (let i = 1; i <= 6; i++) {
      newImages.push({ id: `damaged_${i}`, url: `/demo/damaged_${i}.jpg`, type: 'damaged' as const });
      newImages.push({ id: `undamaged_${i}`, url: `/demo/undamaged_${i}.jpg`, type: 'undamaged' as const });
    }
    // Interleave them so it's not all damaged first
    const interleaved = [];
    for (let i = 0; i < 6; i++) {
      interleaved.push(newImages[i * 2]);
      interleaved.push(newImages[i * 2 + 1]);
    }
    setImages(interleaved);
  }, []);

  return (
    <div className="container animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-montserrat)' }}>
          Suite de Demo Simultánea
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', marginBottom: '2rem' }}>
          Ejecuta la flota de agentes VLM de forma concurrente sobre los 12 casos. El servidor gestionará la cola de forma óptima.
        </p>
        <button 
          onClick={() => setExecutingAll(true)}
          disabled={executingAll}
          className="btn-primary"
          style={{ padding: '1rem 3rem', fontSize: '1.3rem', borderRadius: '16px', opacity: executingAll ? 0.5 : 1, transition: 'all 0.3s' }}
        >
          {executingAll ? "Evaluación Autónoma en Progreso..." : "▶️ Ejecutar Toda la Suite"}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '2rem',
        padding: '1rem'
      }}>
        {images.map((img) => (
          <DemoCard 
            key={img.id}
            id={img.id}
            url={img.url}
            type={img.type}
            startExecution={executingAll}
          />
        ))}
      </div>
    </div>
  );
}
