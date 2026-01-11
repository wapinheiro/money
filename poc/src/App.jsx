import { useState } from 'react'
import './App.css'
import ActionWheel from './ActionWheel'
import './ActionWheel.css'

function App() {
  const [amount, setAmount] = useState('0.00')
  const [mode, setMode] = useState('panic') // panic (numpad), spinner (category)

  const handleDigit = (digit) => {
    if (digit === 'del') {
      const raw = amount.replace('.', '')
      const newRaw = raw.slice(0, -1)
      setAmount((parseInt(newRaw || '0') / 100).toFixed(2))
    } else {
      // Just append digit, existing logic handles shift
      const raw = amount.replace('.', '') + digit
      setAmount((parseInt(raw) / 100).toFixed(2))
    }
  }

  const handleCenterClick = () => {
    if (mode === 'panic') {
      // Save amount, switch to Spinner
      if (amount === '0.00') return
      setMode('spinner')
    } else {
      // Confirm Category
      alert(`Saved $${amount}!`)
      setAmount('0.00')
      setMode('panic') // Reset
    }
  }

  return (
    <div className="app-container">
      {/* DETAILS AREA */}
      <div className="display-area">
        <div style={{ color: '#666', fontSize: '12px', marginBottom: '10px' }}>v0.2 Fix Wobble</div>
        <div className="readout">
          <span className="currency">$</span>
          <span className="amount">{amount}</span>
        </div>

        {/* Carousel Placeholder */}
        {mode === 'spinner' && (
          <div className="carousel-hint">
            Selection Mode (Spin Me!) <br />
            ⬇
          </div>
        )}
      </div>

      {/* PROPOSED ACTION WHEEL ZONE */}
      <div className="wheel-wrapper">
        <ActionWheel
          mode={mode}
          onInput={handleDigit}
        />

        <button className="center-btn" onClick={handleCenterClick}>
          {mode === 'panic' ? 'SAVE' : 'OK'}
        </button>
      </div>

    </div>
  )
}

export default App
