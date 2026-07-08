import React from "react";
import { DirectReport } from "../types";

interface ResultCardProps {
  result: DirectReport;
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="glass-panel animate-fade-in result-card">
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        Resultados del Peritaje
        <span className={`badge ${result.necesita_peritaje ? 'badge-danger' : 'badge-success'}`}>
          {result.necesita_peritaje ? 'Necesita Peritaje' : 'No Necesita Peritaje'}
        </span>
      </h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Daños detectados:</strong>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{result.danos}</p>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Confiabilidad del modelo:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ flex: 1, background: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${result.confiabilidad}%`, background: result.confiabilidad > 70 ? 'var(--success)' : 'var(--warning)', height: '100%' }}></div>
          </div>
          <span>{result.confiabilidad}%</span>
        </div>
      </div>

      <details style={{ marginTop: '2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
        <summary>Ver JSON original y Reportes Crudos</summary>
        <pre style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}
