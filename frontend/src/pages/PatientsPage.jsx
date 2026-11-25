import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UserCheck, X } from 'lucide-react';
import { apiRequest } from '../services/api';

const INITIAL_FORM = {
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  correo_electronico: '',
  contrasena: '',
  sexo: 'F',
  nivel_actividad: 'moderado',
  antecedentes_medicos: '',
  restricciones_alimentarias: '',
  peso_kg: '',
  altura_cm: '',
  porcentaje_grasa: '',
  masa_muscular_kg: '',
};

export default function PatientsPage() {
  const [pacientes, setPacientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const loadPacientes = async (q = '') => {
    setLoading(true);
    try {
      const data = await apiRequest(`/pacientes${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      setPacientes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPacientes(search);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/pacientes', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm(INITIAL_FORM);
      setShowModal(false);
      await loadPacientes(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pacientes e Historias Clínicas</h1>
          <p>Administra los expedientes, antecedentes y mediciones antropométricas de tus pacientes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={17} />
          Nuevo Paciente
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              className="input"
              placeholder="Buscar por nombre, apellido o correo electrónico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" type="submit">
            <Search size={16} />
            Buscar
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Cargando expedientes...</div>
        ) : pacientes.length === 0 ? (
          <div className="empty-state">No se encontraron pacientes registrados.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Edad</th>
                  <th>Último Peso / Altura</th>
                  <th>IMC</th>
                  <th>Planes Aprobados</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => (
                  <tr key={p.id_paciente}>
                    <td>
                      <strong>{p.apellido}, {p.nombre}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#556962' }}>{p.correo_electronico}</div>
                    </td>
                    <td>{p.edad} años</td>
                    <td>
                      {p.ultimo_peso ? `${p.ultimo_peso} kg · ${p.ultima_altura} cm` : 'Sin medición'}
                    </td>
                    <td>
                      {p.imc ? (
                        <span className="badge badge-primary">
                          {p.imc} · {p.clasificacion_imc}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Pendiente</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.planes_aprobados > 0 ? 'badge-success' : 'badge-neutral'}`}>
                        <UserCheck size={13} />
                        {p.planes_aprobados} activo(s)
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/pacientes/${p.id_paciente}`} className="btn btn-soft btn-sm">
                        Ver Expediente
                      </Link>
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
              <h3 className="card-title">Registrar Nuevo Paciente</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  className="input"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Apellido *</label>
                <input
                  className="input"
                  required
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento *</label>
                <input
                  className="input"
                  type="date"
                  required
                  value={form.fecha_nacimiento}
                  onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Sexo biológico</label>
                <select
                  value={form.sexo}
                  onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                >
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div className="form-group">
                <label>Correo electrónico (acceso portal) *</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={form.correo_electronico}
                  onChange={(e) => setForm({ ...form, correo_electronico: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Contraseña inicial del paciente *</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.contrasena}
                  onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                />
              </div>
              <div className="form-group full">
                <label>Nivel de actividad física</label>
                <select
                  value={form.nivel_actividad}
                  onChange={(e) => setForm({ ...form, nivel_actividad: e.target.value })}
                >
                  <option value="sedentario">Sedentario</option>
                  <option value="ligero">Ligero (1-3 días/semana)</option>
                  <option value="moderado">Moderado (3-5 días/semana)</option>
                  <option value="activo">Activo (6-7 días/semana)</option>
                  <option value="muy_activo">Muy activo (alto rendimiento)</option>
                </select>
              </div>
              <div className="form-group full">
                <label>Antecedentes médicos / patologías</label>
                <textarea
                  rows={2}
                  value={form.antecedentes_medicos}
                  onChange={(e) => setForm({ ...form, antecedentes_medicos: e.target.value })}
                  placeholder="Ej. Hipertensión controlada, diabetes tipo 2, hipotiroidismo..."
                />
              </div>
              <div className="form-group full">
                <label>Restricciones alimentarias / alergias</label>
                <textarea
                  rows={2}
                  value={form.restricciones_alimentarias}
                  onChange={(e) => setForm({ ...form, restricciones_alimentarias: e.target.value })}
                  placeholder="Ej. Celiaquía, intolerancia a la lactosa, dieta vegetariana..."
                />
              </div>

              <div className="form-group full" style={{ borderTop: '1px solid #e2e8e5', paddingTop: 12 }}>
                <strong>Primera medición antropométrica (opcional)</strong>
              </div>
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={form.peso_kg}
                  onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Altura (cm)</label>
                <input
                  className="input"
                  type="number"
                  step="0.5"
                  value={form.altura_cm}
                  onChange={(e) => setForm({ ...form, altura_cm: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>% Grasa corporal</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={form.porcentaje_grasa}
                  onChange={(e) => setForm({ ...form, porcentaje_grasa: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Masa muscular (kg)</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={form.masa_muscular_kg}
                  onChange={(e) => setForm({ ...form, masa_muscular_kg: e.target.value })}
                />
              </div>

              <div className="form-group full" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
