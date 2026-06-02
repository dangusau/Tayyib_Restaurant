import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { RestaurantProvider } from './context/RestaurantContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import TransactionForm from './components/Transactions/TransactionForm';
import TransactionDetail from './components/Transactions/TransactionDetail';
import UserManagement from './components/Users/UserManagement';
import UserForm from './components/Users/UserForm';
import { ProtectedRoute } from './components/Common/ProtectedRoute';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RestaurantProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute allowedRoles={['MD', 'Manager', 'NMD']} />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<TransactionList />} />
              <Route
                path="transactions/new"
                element={
                  <ProtectedRoute allowedRoles={['MD', 'Manager']}>
                    <TransactionForm />
                  </ProtectedRoute>
                }
              />
              <Route path="transactions/:id" element={<TransactionDetail />} />
              <Route
                path="transactions/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['MD', 'Manager']}>
                    <TransactionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['MD']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users/new"
                element={
                  <ProtectedRoute allowedRoles={['MD']}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['MD']}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<div className="p-8">Page not found</div>} />
        </Routes>
      </RestaurantProvider>
    </BrowserRouter>
  );
}