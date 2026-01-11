import { useState, useEffect } from 'react'
import { db, seedDatabase } from './db'
import ActionWheel from './ActionWheel'
import './ActionWheel.css'
import './App.css'

function App() {
  const [amount, setAmount] = useState('0.00')
  const [mode, setMode] = useState('panic')
  const [statusMsg, setStatusMsg] = useState('Ready')

  // Initialize DB
  useEffect(() => {
    seedDatabase()
  }, [])

  const handleDigit = (digit) => {
    if (digit === 'del') {
      const raw = amount.replace('.', '')
      const newRaw = raw.slice(0, -1)
      setAmount((parseInt(newRaw || '0') / 100).toFixed(2))
    } else {
      const raw = amount.replace('.', '') + digit
      setAmount((parseInt(raw) / 100).toFixed(2))
    }
  }

  const handleCenterClick = async () => {
    if (mode === 'panic') {
      if (amount === '0.00') return

      // SAVE TO DB
      try {
        await db.transactions.add({
          amount: parseFloat(amount),
          date: new Date(),
          status: 'review', // Needs categorization
          merchant: 'Unknown',
          category: 'Uncategorized'
        })

        // UX Feedback
        setStatusMsg(`Saved $${amount}!`)
        setTimeout(() => setStatusMsg('Ready'), 2000)

        // Reset
        setAmount('0.00')
        // In real app, we might switch to Spinner here. 
        // For Phase 1 "Panic", we just save and reset.

      } catch (error) {
        console.error("Save failed", error)
        setStatusMsg("Error Saving!")
      }
    }
  }

  return (
    <div className="app-container">
      {/* DETAILS AREA */}
      <div className="display-area">
        <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>v1.17 Refined Haptics</div>
        <div className="readout">
          <span className="currency">$</span>
          <span className="amount">{amount}</span>
        </div>
      </div>

      {/* ACTION WHEEL */}
      {/* CONTROLS AREA (Bottom) */}
      <div className="controls-area">
        {/* The Action Wheel Wrapper (320px) sits inside the controls area */}
        <div className="wheel-wrapper">
          <ActionWheel
            mode={mode}
            onInput={handleDigit}
            onSave={handleCenterClick}
          />
          <button className="center-btn" onClick={handleCenterClick}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
