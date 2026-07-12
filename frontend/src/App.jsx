import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const PostDetail = lazy(() => import("./pages/PostDetail.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/admin/login";
    return null;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-8 font-body">Memuat…</div>}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/post/:slug" element={<PostDetail />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
