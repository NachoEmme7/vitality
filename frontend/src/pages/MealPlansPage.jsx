import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardPlus, Copy, Eye, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '../services/api';

export default function MealPlansPage() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id_paciente: '',
    objetivo_calorico: '2000',
    estado: 'Borrador',
    observaciones: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [planesRes, pacsRes] = await Promise.all([
        apiRequest('/planes'),
        apiRequest('/pacientes'),
      ]);
      setPlanes(planesRes);
      setPacientes(pacsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiRequest('/planes', {
        method: 'POST',
        body: JSON.stringify({
          id_paciente: Number(form.id_paciente),
          objetivo_calorico: Number(form.objetivo_calorico),
          estado: form.estado,
          observaciones: form.observaciones,
        }),
      });
      setShowModal(false);
      navigate(`/planes/${res.id_plan}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (idPlan) => {
    setError('');
    try {
      const res = await apiRequest(`/planes/${idPlan}/duplicar`, { method: 'POST' });
      navigate(`/planes/${res.id_plan}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (idPlan) => {
    if (!window.confirm('¿Eliminar este plan alimenticio y todas sus comidas?')) return;
    try {
      await apiRequest(`/planes/${idPlan}`, { method: 'DELETE' });
      setPlanes((prev) => prev.filter((p) => p.id_plan !== idPlan));
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = planes.filter((pl) => {
    const matchesEstado = estadoFilter === 'Todos' || pl.estado === estadoFilter;
    const fullName = `${pl.paciente_nombre} ${pl.paciente_apellido}`.toLowerCase();
    const matchesSearch = fullName.includes(search.trim().toLowerCase());
    return matchesEstado && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Planes Alimenticios</h1>
          <p>Diseña, valida y administra los planes semanales asignados a tus pacientes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <ClipboardPlus size={17} />
          Nuevo Plan Alimenticio
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <Search
              size={16}
              color="#556962"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar plan por nombre de paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Todos', 'Aprobado', 'Borrador', 'Archivado'].map((est) => (
              <button
                key={est}
                type="button"
                className={`tab-btn ${estadoFilter === est ? 'active' : ''}`}
                onClick={() => setEstadoFilter(est)}
              >
                {est}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Cargando planes alimenticios...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            No se encontraron planes alimenticios con los filtros seleccionados.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Paciente</th>
                  <th>Objetivo Diario</th>
                  <th>Comidas</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pl) => (
                  <tr key={pl.id_plan}>
                    <td><strong>#{pl.id_plan}</strong></td>
                    <td>
                      <Link
                        to={`/pacientes/${pl.id_paciente}`}
                        style={{ fontWeight: 600, color: '#0f766e' }}
                      >
                        {pl.paciente_nombre} {pl.paciente_apellido}
                      </Link>
                    </td>
                    <td>{pl.objetivo_calorico} kcal</td>
                    <td>{pl.total_comidas} cargada(s)</td>
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
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <Link to={`/planes/${pl.id_plan}`} className="btn btn-soft btn-sm">
                          <Eye size={14} />
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDuplicate(pl.id_plan)}
                          title="Duplicar plan como nuevo borrador"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(pl.id_plan)}
                          title="Eliminar plan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Crear Nuevo Plan Alimenticio</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModal(false)}
              >
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
                  <option value="">— Seleccionar paciente —</option>
                  {pacientes.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.apellido}, {p.nombre} ({p.edad} años)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Objetivo Calórico Diario (kcal) *</label>
                <input
                  className="input"
                  type="number"
                  min={800}
                  max={6000}
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
                  <option value="Borrador">Borrador (solo profesional)</option>
                  <option value="Aprobado">Aprobado (visible para paciente)</option>
                  <option value="Archivado">Archivado</option>
                </select>
              </div>

              <div className="form-group full">
                <label>Observaciones e indicaciones clínicas</label>
                <textarea
                  rows={3}
                  placeholder="Ej. Priorizar hidratación de 2.5 L/día, evitar lácteos con lactosa..."
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                />
              </div>

              <div className="form-group full" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creando...' : 'Crear y cargar comidas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
