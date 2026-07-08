export interface AgenticReport {
  requiere_peritaje_humano: boolean;
  confiabilidad_porcentaje: number;
  resumen_veredicto: string;
  analisis_global: string;
  analisis_piezas: string;
  desperfectos?: {
    box_norm: [number, number, number, number];
    descripcion: string;
  }[];
}

export interface DirectReport {
  necesita_peritaje: boolean;
  danos: string;
  confiabilidad: number;
  _reportes_crudos?: {
    global: string;
    bloques: string[];
  };
}

export interface AgenticAnalysisResult {
  report: AgenticReport;
  crops: string[];
}

export interface ComparativeDesperfecto {
  box_norm: [number, number, number, number];
  descripcion: string;
  preexistente: boolean;
  justificacion_preexistencia: string;
}

export interface AgenticComparativeReport {
  requiere_peritaje_humano: boolean;
  confiabilidad_porcentaje: number;
  resumen_veredicto: string;
  analisis_global: string;
  analisis_piezas: string;
  desperfectos?: ComparativeDesperfecto[];
}

export interface AgenticComparativeResult {
  report: AgenticComparativeReport;
  crops_after: string[];
}
