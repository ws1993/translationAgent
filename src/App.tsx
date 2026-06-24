import { BrowserRouter } from 'react-router-dom';
import Router from './Router';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <Router />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
