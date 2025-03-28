import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Import pages
import Scanner from './pages/Scanner';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="app">
      <header>
        <nav className="navbar">
          <div className="container">
            <h1>Web Barcoder</h1>
            <ul className="nav-links">
              <li>
                <Link to="/">Scanner</Link>
              </li>
              <li>
                <Link to="/gallery">Gallery</Link>
              </li>
              <li>
                <Link to="/settings">Settings</Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Scanner />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;
