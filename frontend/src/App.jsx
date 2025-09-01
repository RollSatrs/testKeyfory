import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { DigitalServices } from "./Pages/DigitalServicesPage/DigitalServices";
import { Executors } from "./Pages/ExecutersPage/Executors";
import { Orders } from "./Pages/OrdersPage/Orders";
import { KeysMaterials } from "./Pages/KeyMaterialsPage/KeysMaterials";
import { Analytics } from "./Pages/AnalyticsPage/Analytics";
import { SystemLogs } from "./Pages/SystemLogsPage/SystemLogs";
import { Setting } from "./Pages/SettingPage/Setting";
import MaterialReplacement from "./Pages/MaterialReplacementPage/MaterialReplacement";
import { ExecuterPricing } from "./Pages/ExecuterPricingPage/ExecuterPricing";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Auth } from "./Pages/AuthPage/Auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Aside } from "./components/Aside";

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Aside />
              <div className="min-h-screen flex">
                <div className="flex-1 space-y-6 p-6 bg-gray-100 ml-64">
                  <Outlet />
                </div>
              </div>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/services" />} />
          <Route path="services" element={<DigitalServices />} />
          <Route path="users" element={<Executors />} />
          <Route path="pricing" element={<ExecuterPricing />} />
          <Route path="orders" element={<Orders />} />
          <Route path="materials" element={<KeysMaterials />} />
          <Route
            path="material-replacement"
            element={<MaterialReplacement />}
          />
          <Route path="analytics" element={<Analytics />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="settings" element={<Setting />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}
