import { BrowserRouter } from 'react-router-dom';
import Router from './Router';
import { Toaster } from './components/ui/toaster';
import { useAutoSync } from './hooks/useAutoSync';

function App() {
  useAutoSync();

  return (
    <BrowserRouter>
      <Router />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
