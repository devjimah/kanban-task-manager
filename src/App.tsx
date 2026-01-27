import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import TaskView from './pages/TaskView';
import Login from './pages/Login';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />

        <Route path="/" element={
          <Layout>
            <PageTransition>
              <Dashboard />
            </PageTransition>
          </Layout>
        } />
        
        <Route path="/board/:boardId" element={
          <Layout>
            <PageTransition>
              <BoardView />
            </PageTransition>
          </Layout>
        } />

        {/* Nested route for individual tasks */}
        <Route path="/board/:boardId/task/:taskId" element={
          <Layout>
            <PageTransition>
              <TaskView />
            </PageTransition>
          </Layout>
        } />

        <Route path="/admin" element={
          <Layout>
            <ProtectedRoute>
              <PageTransition>
                <Admin />
              </PageTransition>
            </ProtectedRoute>
          </Layout>
        } />

        {/* Wildcard route - must be last */}
        <Route path="*" element={
          <Layout>
            <PageTransition>
              <NotFound />
            </PageTransition>
          </Layout>
        } />
      </Routes>
    </AnimatePresence>
  );
}
