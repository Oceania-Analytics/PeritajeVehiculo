"use client";

import { useState } from "react";
import Link from "next/link";
import { AgenticReport } from "@/types";

export default function PeritajePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AgenticReport | null>(null);
  const [crops, setCrops] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setReport(null);
      setCrops([]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setReport(null);
      setCrops([]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor, selecciona una imagen primero.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setCrops([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Error al conectar con el Agente (Asegúrate de que la API de Python esté corriendo)");
      }

      const result = await response.json();
      setReport(result.data.report);
      setCrops(result.data.crops || []);
    } catch (err: unknown) {
      let errorMessage = "Error desconocido";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage === "Failed to fetch" 
        ? "Error de conexión: El backend de Python no está activo. Ejecuta uvicorn." 
        : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Loading Overlay with Glassmorphism */}
      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <div className="glass-overlay" style={{ padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🤖</div>
            <h2 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-montserrat)' }}>Analizando con IA</h2>
            <p style={{ color: 'var(--text-secondary)' }}>El agente VLM y YOLOv8 están procesando la imagen...</p>
            <style>{`
              @keyframes pulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 10px var(--accent-light)); }
                100% { transform: scale(1); opacity: 0.8; }
              }
            `}</style>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-montserrat)' }}>
          Evaluación de Daños por IA
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
          Sube una foto del vehículo para que nuestro agente detecte piezas, haga recortes (crops) y analice los daños de manera autónoma.
        </p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <label 
            className="upload-area" 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ 
              display: 'block', 
              borderColor: isDragging ? 'var(--accent-color)' : '',
              backgroundColor: isDragging ? '#f1f5f9' : ''
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontFamily: 'var(--font-montserrat)' }}>
              {file ? file.name : "Haz clic o arrastra la foto del vehículo"}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Formatos soportados: JPG, PNG
            </p>
            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
          </label>

          {file && (
            <div style={{ textAlign: 'center', position: 'relative', display: 'inline-block' }}>
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                className="preview-image"
                style={{ display: 'block', maxWidth: '100%', height: 'auto', maxHeight: '500px' }}
              />
              
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
          )}

          <button 
            type="submit" 
            disabled={!file || loading}
            className="btn-primary"
            style={{ padding: '1rem', fontSize: '1.2rem', justifyContent: 'center' }}
          >
            Ejecutar Peritaje Autónomo
          </button>
        </form>
      </div>

      {error && (
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '2rem auto', borderColor: 'var(--danger)', backgroundColor: '#fef2f2' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>⚠️ Error</h3>
          <p style={{ color: 'var(--text-primary)' }}>{error}</p>
        </div>
      )}

      {report && (
        <div className="glass-panel animate-fade-in result-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-montserrat)' }}>📋 Informe Pericial ReAct</h2>
            <span className="badge badge-success">Análisis Completado</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px', padding: '1.5rem', borderRadius: '12px', background: report.requiere_peritaje_humano ? '#fef2f2' : '#ecfdf5', border: `1px solid ${report.requiere_peritaje_humano ? 'var(--danger)' : 'var(--success)'}`, textAlign: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Dictamen</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: report.requiere_peritaje_humano ? 'var(--danger)' : 'var(--success)' }}>
                {report.requiere_peritaje_humano ? 'Requiere Informe Humano' : 'Sin Daños Graves'}
              </p>
            </div>
            
            <div style={{ flex: '1', minWidth: '200px', padding: '1.5rem', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Confiabilidad</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {report.confiabilidad_porcentaje}%
              </p>
            </div>
          </div>

          {report.resumen_veredicto && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.2rem', fontFamily: 'var(--font-montserrat)' }}>Resumen del Veredicto</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{report.resumen_veredicto}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)' }}>
                <span>👁️</span> Análisis Global
              </h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{report.analisis_global}</p>
            </div>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)' }}>
                <span>🔍</span> Análisis Hiper-enfocado (Por Piezas)
              </h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{report.analisis_piezas}</p>
            </div>
          </div>
        </div>
      )}

      {crops.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', fontFamily: 'var(--font-montserrat)' }}>
            🔍 Recortes Analizados
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Se evaluaron las siguientes áreas detectadas por YOLOv8:
          </p>
          <ul style={{ listStylePosition: 'inside', color: 'var(--text-primary)' }}>
            {crops.map((crop, idx) => {
               // Extract just the filename to look cleaner
               const filename = crop.split('/').pop();
               return (
                <li key={idx} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f1f5f9', borderRadius: '4px', fontFamily: 'monospace' }}>
                  {filename}
                </li>
               )
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
