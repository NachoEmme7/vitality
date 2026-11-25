import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Calculator, CheckCircle2, ClipboardList, FileClock, Plus, Users } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const kpis = data?.kpis || {
    total_pacientes: 0,
    planes_aprobados: 0,
    planes_borrador: 0,
    total_mediciones: 0,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bienvenido/a, Lic. {user?.nombre} {user?.apellido}</h1>
          <p>Resumen operativo de tu consultorio nutricional · Matrícula {user?.matricula}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/calculadora" className="btn btn-secondary">
            <Calculator size={17} />
            Calculadora Clínica
          </Link>
          <Link to="/pacientes" className="btn btn-primary">
            <Plus size={17} />
            Gestionar Pacientes
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-4" style={{ marginBottom: 22 }}>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Pacientes activos</div>
            <div className="kpi-value">{kpis.total_pacientes}</div>
          </div>
          <div className="kpi-icon"><Users size={20} /></div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Planes aprobados</div>
            <div className="kpi-value">{kpis.planes_aprobados}</div>
          </div>
          <div className="kpi-icon"><CheckCircle2 size={20} /></div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Planes en borrador</div>
            <div className="kpi-value">{kpis.planes_borrador}</div>
          </div>
          <div className="kpi-icon"><FileClock size={20} /></div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Mediciones antropométricas</div>
            <div className="kpi-value">{kpis.total_mediciones}</div>
          </div>
          <div className="kpi-icon"><Activity size={20} /></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Planes alimenticios recientes</h3>
            <Link to="/planes" className="btn btn-soft btn-sm">
              Ver todos
            </Link>
          </div>
          {!data?.ultimos_planes?.length ? (
            <div className="empty-state">Todavía no has creado planes alimenticios.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Objetivo</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.ultimos_planes.map((pl) => (
                    <tr key={pl.id_plan}>
                      <td>
                        <strong>{pl.paciente_nombre} {pl.paciente_apellido}</strong>
                      </td>
                      <td>{pl.objetivo_calorico} kcal</td>
                      <td>
                        <span
                          className={`badge ${
                            pl.estado === 'Aprobado'
                              ? 'badge-success'
                              : pl.estado === 'Borrador'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                        >
                          {pl.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/planes/${pl.id_plan}`} className="btn btn-secondary btn-sm">
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Flujo de trabajo clínico</h3>
            <ClipboardList size={19} color="#0f766e" />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="meal-card">
              <div>
                <strong>1. Expediente e Historia Clínica</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#556962' }}>
                  Registra pacientes, antecedentes médicos, restricciones alimentarias y genera su
                  acceso seguro de solo lectura.
                </p>
              </div>
              <Link to="/pacientes" className="btn btn-soft btn-sm">Ir</Link>
            </div>
            <div className="meal-card">
              <div>
                <strong>2. Evaluación Antropométrica y Requerimientos</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#556962' }}>
                  Calcula IMC, TMB (Mifflin-St Jeor o Harris-Benedict), GET y distribución de
                  macronutrientes en segundos.
                </p>
              </div>
              <Link to="/calculadora" className="btn btn-soft btn-sm">Ir</Link>
            </div>
            <div className="meal-card">
              <div>
                <strong>3. Diseño y Validación del Plan Semanal</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#556962' }}>
                  Estructura comidas por día y momento, controla las calorías totales y aprueba el
                  plan para habilitarlo al paciente.
                </p>
              </div>
              <Link to="/planes" className="btn btn-soft btn-sm">Ir</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
