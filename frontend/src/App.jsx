import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import CalculatorPage from './pages/CalculatorPage';
import MealPlansPage from './pages/MealPlansPage';
import PlanEditorPage from './pages/PlanEditorPage';
import PatientPortalPage from './pages/PatientPortalPage';

function ProtectedRoute({ allowedRole, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="empty-state">Verificando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.rol !== allowedRole) {
    return <Navigate to={user.rol === 'profesional' ? '/panel' : '/mi-plan'} replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();

  const homePath = !user
    ? '/login'
    : user.rol === 'profesional'
    ? '/panel'
    : '/mi-plan';

  return (
    <Routes>
      <Route
        path="/login"
        element={!loading && user ? <Navigate to={homePath} replace /> : <LoginPage />}
      />

      {/* Rutas exclusivas del Profesional */}
      <Route
        path="/panel"
        element={
          <ProtectedRoute allowedRole="profesional">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes"
        element={
          <ProtectedRoute allowedRole="profesional">
            <PatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:id"
        element={
          <ProtectedRoute allowedRole="profesional">
            <PatientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculadora"
        element={
          <ProtectedRoute allowedRole="profesional">
            <CalculatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planes"
        element={
          <ProtectedRoute allowedRole="profesional">
            <MealPlansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planes/:idPlan"
        element={
          <ProtectedRoute allowedRole="profesional">
            <PlanEditorPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta exclusiva del Paciente (Solo lectura) */}
      <Route
        path="/mi-plan"
        element={
          <ProtectedRoute allowedRole="paciente">
            <PatientPortalPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}
