import { useState, useEffect } from 'react'
import { seedDatabase } from './db'
import './App.css'

// Views
import HomeView from './HomeView'
import SettingsView from './SettingsView'
import CaptureView from './CaptureView'

function App() {
  const [view, setView] = useState('home') // 'home' | 'capture' | 'settings'
  const [theme, setTheme] = useState('midnight')

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Initialize DB on mount
  useEffect(() => {
    seedDatabase().catch(err => console.error(err))
  }, [])

  return (
    <div className="app-container">
      {/* ROUTER LOGIC */}
      {view === 'home' && (
        <HomeView
          onOpenCapture={() => setView('capture')}
          onOpenSettings={() => setView('settings')}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          currentTheme={theme}
          onSetTheme={setTheme}
          onBack={() => setView('home')}
        />
      )}

      {view === 'capture' && (
        <CaptureView
          onClose={() => setView('home')} // Returns to home after save/cancel
        />
      )}
    </div>
  )
}

export default App
