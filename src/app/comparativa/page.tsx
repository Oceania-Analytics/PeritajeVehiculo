"use client";

import { useState } from "react";
import { AgenticComparativeReport } from "@/types";

export default function ComparativaPage() {
  const [fileBefore, setFileBefore] = useState<File | null>(null);
  const [fileAfter, setFileAfter] = useState<File | null>(null);
  
  const [previewBefore, setPreviewBefore] = useState<string | null>(null);
  const [previewAfter, setPreviewAfter] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AgenticComparativeReport | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'before') {
      setFileBefore(file);
      setPreviewBefore(URL.createObjectURL(file));
    } else {
      setFileAfter(file);
      setPreviewAfter(URL.createObjectURL(file));
    }
    setReport(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileBefore || !fileAfter) {
      setError("Debes subir ambas imágenes (Antes y Después).");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append("file_before", fileBefore);
      formData.append("file_after", fileAfter);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/compare`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Error al conectar con la IA de Peritaje.");
      }

      const result = await response.json();
      setReport(result.data.report);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
        }}>
          <div className="glass-overlay" style={{ padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>⚖️</div>
            <h2 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-montserrat)' }}>Analizando Fraude</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Comparando ambas imágenes con IA Agéntica...</p>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'var(--font-montserrat)' }}>
          Investigación de Fraude
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          Sube la fotografía previa al siniestro y la posterior. La IA detectará daños preexistentes.
        </p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto 2rem auto', padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* ANTES */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>📸 Foto ANTES (Original)</h3>
              <div 
                className="upload-area" 
                style={{ 
                  height: '250px', 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  background: 'var(--glass-bg)'
                }}
                onClick={() => document.getElementById('fileBefore')?.click()}
              >
                {previewBefore ? (
                  <img src={previewBefore} alt="Antes" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>Haz clic para seleccionar</div>
                )}
                <input 
                  type="file" 
                  id="fileBefore" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'before')} 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>

            {/* DESPUÉS */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>💥 Foto DESPUÉS (Siniestro)</h3>
              <div 
                className="upload-area" 
                style={{ 
                  height: '250px', 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  background: 'var(--glass-bg)'
                }}
                onClick={() => document.getElementById('fileAfter')?.click()}
              >
                {previewAfter ? (
                  <img src={previewAfter} alt="Después" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>Haz clic para seleccionar</div>
                )}
                <input 
                  type="file" 
                  id="fileAfter" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'after')} 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>

          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || !fileBefore || !fileAfter}
              style={{ padding: '1rem 3rem', fontSize: '1.2rem', width: '100%', maxWidth: '400px' }}
            >
              Ejecutar Análisis Comparativo
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto 2rem auto', borderColor: 'var(--danger)', backgroundColor: '#fef2f2' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>⚠️ Error</h3>
          <p style={{ color: 'var(--text-primary)' }}>{error}</p>
        </div>
      )}

      {report && (
        <div className="glass-panel animate-fade-in result-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-montserrat)' }}>⚖️ Dictamen de Fraude (ReAct)</h2>
            <span className="badge badge-success">Análisis Completado</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px', padding: '1.5rem', borderRadius: '12px', background: report.requiere_peritaje_humano ? '#fef2f2' : '#ecfdf5', border: `1px solid ${report.requiere_peritaje_humano ? 'var(--danger)' : 'var(--success)'}`, textAlign: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Alerta de Fraude</h4>
              <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: report.requiere_peritaje_humano ? 'var(--danger)' : 'var(--success)' }}>
                {report.requiere_peritaje_humano ? 'Requiere Investigación Humana' : 'Sin Indicios Graves'}
              </p>
            </div>
            
            <div style={{ flex: '1', minWidth: '200px', padding: '1.5rem', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Confiabilidad</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {report.confiabilidad_porcentaje}%
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.2rem', fontFamily: 'var(--font-montserrat)' }}>Resumen del Veredicto</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{report.resumen_veredicto}</p>
          </div>

          {report.desperfectos && report.desperfectos.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.2rem', fontFamily: 'var(--font-montserrat)' }}>Daños Detectados</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {report.desperfectos.map((d, i) => (
                  <div key={i} style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: `1px solid ${d.preexistente ? '#f59e0b' : '#3b82f6'}`,
                    background: d.preexistente ? '#fffbeb' : '#eff6ff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{d.descripcion}</strong>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        backgroundColor: d.preexistente ? '#f59e0b' : '#3b82f6',
                        color: 'white'
                      }}>
                        {d.preexistente ? '⚠️ PREEXISTENTE' : '🆕 NUEVO'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                      <em>Justificación:</em> {d.justificacion_preexistencia}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)' }}>
                <span>👁️</span> Análisis Global Comparativo
              </h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{report.analisis_global}</p>
            </div>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)' }}>
                <span>🔍</span> Análisis Detallado
              </h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{report.analisis_piezas}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
