import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardPlus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../services/api';

export default function PlansPage() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    id_paciente: '',
    objetivo_calorico: '2000',
    estado: 'Borrador',
    observaciones: '',
  });

  const loadAll = async () => {
    try {
      const [pl, pac] = await Promise.all([apiRequest('/planes'), apiRequest('/pacientes')]);
      setPlanes(pl);
      setPacientes(pac);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiRequest('/planes', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowModal(false);
      navigate(`/planes/${res.id_plan}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (idPlan) => {
    if (!window.confirm('¿Eliminar este plan alimenticio y todas sus comidas?')) return;
    try {
      await apiRequest(`/planes/${idPlan}`, { method: 'DELETE' });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered =
    filtro === 'Todos' ? planes : planes.filter((pl) => pl.estado === filtro);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Planes Alimenticios</h1>
          <p>Diseña, valida y aprueba los planes personalizados para cada paciente.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <ClipboardPlus size={17} />
          Crear Plan Alimenticio
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        {['Todos', 'Aprobado', 'Borrador', 'Archivado'].map((estado) => (
          <button
            key={estado}
            className={`tab-btn ${filtro === estado ? 'active' : ''}`}
            onClick={() => setFiltro(estado)}
          >
            {estado}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">No hay planes alimenticios en esta categoría.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Paciente</th>
                  <th>Objetivo Calórico</th>
                  <th>Comidas</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pl) => (
                  <tr key={pl.id_plan}>
                    <td><strong>#{pl.id_plan}</strong></td>
                    <td>{pl.paciente_nombre} {pl.paciente_apellido}</td>
                    <td>{pl.objetivo_calorico} kcal/día</td>
                    <td>{pl.total_comidas} ítem(s)</td>
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
                    <td>{String(pl.fecha_creacion).slice(0, 10)}</td>
                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Link to={`/planes/${pl.id_plan}`} className="btn btn-soft btn-sm">
                        Abrir Editor
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(pl.id_plan)}
                        title="Eliminar plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="card-header">
              <h3 className="card-title">Nuevo Plan Alimenticio</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="form-grid">
              <div className="form-group full">
                <label>Paciente *</label>
                <select
                  required
                  value={form.id_paciente}
                  onChange={(e) => setForm({ ...form, id_paciente: e.target.value })}
                >
                  <option value="">Selecciona un paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.apellido}, {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Objetivo calórico diario (kcal) *</label>
                <input
                  className="input"
                  type="number"
                  required
                  value={form.objetivo_calorico}
                  onChange={(e) => setForm({ ...form, objetivo_calorico: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Estado inicial</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                >
                  <option value="Borrador">Borrador</option>
                  <option value="Aprobado">Aprobado (visible para el paciente)</option>
                </select>
              </div>
              <div className="form-group full">
                <label>Observaciones e indicaciones profesionales</label>
                <textarea
                  rows={3}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Indicaciones de hidratación, suplementación, horarios o recomendaciones..."
                />
              </div>
              <div className="form-group full" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear y abrir editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
