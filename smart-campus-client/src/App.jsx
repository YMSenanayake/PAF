import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import OAuthRedirect from './components/OAuthRedirect';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* The route Google sends the user back to */}
        <Route path="/oauth-redirect" element={<OAuthRedirect />} />
        {/* The secure area */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;