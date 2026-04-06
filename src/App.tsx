import { AppRoutes } from './routes';
import { AppSocketProvider } from '@/providers/AppSocketProvider';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <AppSocketProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AppSocketProvider>
    </div>
  );
}

export default App;