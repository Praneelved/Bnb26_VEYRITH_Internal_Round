// App.tsx - Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Pages
import Home from './pages/Home';
import CreateRoundtable from './pages/CreateRoundtable';
import JoinRoundtable from './pages/JoinRoundtable';
import Lobby from './pages/Lobby';
import Enrollment from './pages/Enrollment';
import LiveSession from './pages/LiveSession';
import Transcript from './pages/Transcript';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<Home />} />

        {/* Create a new session */}
        <Route path="/create" element={<CreateRoundtable />} />

        {/* Join by code (manual entry) */}
        <Route path="/join" element={<JoinRoundtable />} />

        {/* Join via QR code URL: /join/:code */}
        <Route path="/join/:code" element={<JoinRoundtable />} />

        {/* Lobby waiting room */}
        <Route path="/lobby/:sessionId" element={<Lobby />} />

        {/* Voice enrollment */}
        <Route path="/session/:sessionId/enroll" element={<Enrollment />} />

        {/* Live session — hero page */}
        <Route path="/session/:sessionId/live" element={<LiveSession />} />

        {/* Transcript viewer */}
        <Route path="/session/:sessionId/transcript" element={<Transcript />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
