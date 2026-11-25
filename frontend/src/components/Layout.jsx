import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Calculator,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VitalityLogo from './VitalityLogo';
import ThemeSwitcher from './ThemeSwitcher';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isProf = user?.rol === 'profesional';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" style={{ justifyContent: 'center', paddingBottom: 16 }}>
          <VitalityLogo
            size={64}
            subtitle={isProf ? 'Consultorio Nutricional' : 'Portal del Paciente'}
          />
        </div>

        <nav className="nav-links">
          {isProf ? (
            <>
              <NavLink
                to="/panel"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                Panel Principal
              </NavLink>
              <NavLink
                to="/pacientes"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Users size={18} />
                Pacientes e Historias
              </NavLink>
              <NavLink
                to="/calculadora"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Calculator size={18} />
                Calculadora Clínica
              </NavLink>
              <NavLink
                to="/planes"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <ClipboardList size={18} />
                Planes Alimenticios
              </NavLink>
            </>
          ) : (
            <NavLink
              to="/mi-plan"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Activity size={18} />
              Mi Plan y Evolución
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', paddingLeft: 2 }}>
              Apariencia
            </span>
            <ThemeSwitcher compact />
          </div>
          <div className="user-chip">
            <strong>
              {user?.nombre} {user?.apellido}
            </strong>
            <span>
              {isProf
                ? `Lic. en Nutrición · Mat. ${user?.matricula}`
                : 'Paciente (Solo lectura)'}
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
