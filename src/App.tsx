import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import Login from './pages/Login';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="*" element={<Layout><NotFound /></Layout>} />

      <Route path="/" element={
        <Layout>
           <Dashboard />
        </Layout>
      } />
      
      <Route path="/board/:boardId" element={
        <Layout>
          <BoardView />
        </Layout>
      } />

      <Route path="/admin" element={
        <Layout>
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        </Layout>
      } />
    </Routes>
  );
}
