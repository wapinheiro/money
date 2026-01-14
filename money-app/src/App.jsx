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

  // ERGONOMICS STATE
  const [layout, setLayout] = useState('standard') // 'standard' | 'thumb' | 'visual'
  const [hand, setHand] = useState('center') // 'center' | 'right' | 'left'
  const [ergoAutoSwitch, setErgoAutoSwitch] = useState(true) // Auto-switch to TH (Keypad) for Review (Default: TRUE)
  const [defaultInput, setDefaultInput] = useState('wheel') // 'wheel' | 'keypad'
  const [homeGrouping, setHomeGrouping] = useState('category') // 'category' | 'account'

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Initialize DB on mount
  useEffect(() => {
    seedDatabase().catch(err => console.error(err))
  }, [])

  // Derived CSS Vars
  const getErgoStyles = () => {
    let size = '320px'
    let displayMod = '10px'
    let scale = '1' // Default scale for summary card

    if (layout === 'thumb') {
      size = '360px'
      displayMod = '0px' // Minimal padding
      scale = '0.85' // 85% Scale
    } else if (layout === 'visual') {
      size = '280px'
      displayMod = '20px'
    }

    let offset = '0px'
    // Centered Base: +/- 40px is a safe shift.
    if (hand === 'right') offset = '40px'
    if (hand === 'left') offset = '-40px'

    return {
      '--wheel-size': size,
      '--wheel-x-offset': offset,
      '--display-padding': displayMod,
      '--summary-scale': scale
    }
  }

  return (
    <div className="app-container" style={getErgoStyles()}>
      {/* ROUTER LOGIC */}
      {view === 'home' && (
        <HomeView
          onOpenCapture={() => setView('capture')}
          onOpenSettings={() => setView('settings')}
          grouping={homeGrouping}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          currentTheme={theme}
          onSetTheme={setTheme}
          currentLayout={layout}
          onSetLayout={setLayout}
          currentHand={hand}
          onSetHand={setHand}
          ergoAutoSwitch={ergoAutoSwitch}
          onSetErgoAutoSwitch={setErgoAutoSwitch}
          defaultInput={defaultInput}
          onSetDefaultInput={setDefaultInput}
          homeGrouping={homeGrouping}
          onSetHomeGrouping={setHomeGrouping}
          onBack={() => setView('home')}
        />
      )}

      {view === 'capture' && (
        <CaptureView
          onClose={() => setView('home')} // Returns to home after save/cancel
          ergoAutoSwitch={ergoAutoSwitch}
          defaultInput={defaultInput}
        />
      )}
    </div>
  )
}

export default App
