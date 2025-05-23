import HertaKuru from './components/HertaKuru';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:lang?" element={<HertaKuru />} />
      </Routes>
    </Router>
  );
}