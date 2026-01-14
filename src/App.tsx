import { AppRoutes } from './routes';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <AppRoutes />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;