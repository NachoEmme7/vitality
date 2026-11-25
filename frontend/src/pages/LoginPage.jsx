import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VitalityLogo from '../components/VitalityLogo';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function LoginPage() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [tipoUsuario, setTipoUsuario] = useState('profesional');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    matricula: '',
    correo_electronico: '',
    contrasena: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            correo_electronico: form.correo_electronico,
            contrasena: form.contrasena,
            tipo_usuario: tipoUsuario,
          }),
        });
        loginSuccess(res.token, res.user);
        navigate(res.user.rol === 'profesional' ? '/panel' : '/mi-plan');
      } else {
        const res = await apiRequest('/auth/register-profesional', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        loginSuccess(res.token, res.user);
        navigate('/panel');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setMode('login');
    setError('');
    if (role === 'profesional') {
      setTipoUsuario('profesional');
      setForm((prev) => ({
        ...prev,
        correo_electronico: 'nutricionista@vitality.com',
        contrasena: 'vitality123',
      }));
    } else {
      setTipoUsuario('paciente');
      setForm((prev) => ({
        ...prev,
        correo_electronico: 'lucas@vitality.com',
        contrasena: 'paciente123',
      }));
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-hero-bg-art" aria-hidden="true">
          <img src="/login-nutritionist.jpg" alt="" />
        </div>
        <img
          src="/vitality-logo.svg"
          alt=""
          className="login-hero-watermark"
          aria-hidden="true"
        />

        <div className="login-hero-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 15,
                padding: '8px 13px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
              }}
            >
              <VitalityLogo size={52} />
            </div>
            <div>
              <span style={{ fontSize: '0.94rem', fontWeight: 700, opacity: 0.96, display: 'block' }}>
                Vitality Cloud
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.84 }}>
                Software para Consultorios Nutricionales
              </span>
            </div>
          </div>
        </div>

        <div className="login-hero-bottom">
          <h1>Tu próxima consulta empieza con todo en orden.</h1>
          <p>
            La plataforma todo-en-uno para nutricionistas modernos: expedientes, cálculos clínicos,
            planes semanales en PDF y seguimiento continuo de tus pacientes.
          </p>

          <div className="hero-checklist">
            <div className="hero-check-item">
              <CheckCircle2 size={18} />
              <span>Registrá el progreso antropométrico de cada paciente en segundos</span>
            </div>
            <div className="hero-check-item">
              <CheckCircle2 size={18} />
              <span>Planes semanales interactivos, exportación a PDF y alertas inteligentes</span>
            </div>
            <div className="hero-check-item">
              <CheckCircle2 size={18} />
              <span>Vínculo continuo entre consultas con Portal exclusivo para pacientes</span>
            </div>
          </div>

          <div className="login-hero-footer">
            © 2026 Vitality · Gestión nutricional simple y ordenada
          </div>
        </div>
      </section>

      <section className="login-panel" style={{ position: 'relative' }}>
        <div className="login-theme-bar">
          <ThemeSwitcher />
        </div>
        <div className="login-card">
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: '1.45rem' }}>
              {mode === 'login' ? 'Iniciar sesión' : 'Registro Profesional'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#556962' }}>
              {mode === 'login'
                ? 'Accede a tu consultorio o consulta tu plan alimenticio aprobado.'
                : 'Crea una cuenta exclusiva para profesionales de la nutrición matriculados.'}
            </p>
          </div>

          {mode === 'login' && (
            <div className="tabs" style={{ marginBottom: 18 }}>
              <button
                type="button"
                className={`tab-btn ${tipoUsuario === 'profesional' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setTipoUsuario('profesional')}
              >
                Profesional
              </button>
              <button
                type="button"
                className={`tab-btn ${tipoUsuario === 'paciente' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setTipoUsuario('paciente')}
              >
                Paciente
              </button>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 13 }}>
            {mode === 'register' && (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      className="input"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Ej. Sofía"
                    />
                  </div>
                  <div className="form-group">
                    <label>Apellido</label>
                    <input
                      className="input"
                      name="apellido"
                      value={form.apellido}
                      onChange={handleChange}
                      required
                      placeholder="Ej. Mendoza"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Matrícula Profesional</label>
                  <input
                    className="input"
                    name="matricula"
                    value={form.matricula}
                    onChange={handleChange}
                    required
                    placeholder="Ej. MP-4821"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                className="input"
                type="email"
                name="correo_electronico"
                value={form.correo_electronico}
                onChange={handleChange}
                required
                placeholder="nombre@vitality.com"
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                className="input"
                type="password"
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading
                ? 'Ingresando...'
                : mode === 'login'
                ? 'Ingresar a Vitality'
                : 'Registrar consultorio'}
            </button>
          </form>

          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid #e2e8e5',
              textAlign: 'center',
              fontSize: '0.86rem',
            }}
          >
            {mode === 'login' ? (
              <>
                ¿Eres nutricionista y aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f766e',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Regístrate aquí
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f766e',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 10,
              background: '#f0f5f3',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 8 }}>
              <CheckCircle2 size={15} color="#0f766e" />
              Acceso rápido de demostración
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => fillDemo('profesional')}
              >
                Demo Nutricionista
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => fillDemo('paciente')}
              >
                Demo Paciente
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
