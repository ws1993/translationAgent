import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Translation from './pages/Translation';
import Settings from './pages/Settings';
import FileTranslation from './pages/FileTranslation';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/translation" replace />} />
        <Route path="translation" element={<Translation />} />
        <Route path="file-translation" element={<FileTranslation />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default Router;
