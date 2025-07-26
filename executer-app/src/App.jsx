import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Dashboard from './Pages/DashboardPage/Dashboard'
import OrdersPage from './Pages/OrdersPage/Orders'
import ProfilePage from './Pages/ProfilePage/Profile'
import {Auth} from './Pages/AuthPage/Auth'

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <>
              {/* Можно добавить ProtectedRoute и Aside, если нужно */}
              <Outlet />
            </>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}