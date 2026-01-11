import { useState, useEffect } from 'react'
import { db, seedDatabase } from './db'
import ActionWheel from './ActionWheel'
import './ActionWheel.css'
import './App.css'

// CONSTANTS
const NUMPAD_ITEMS = [
  { label: '0', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '⌫', value: 'del' },
]

const MOCK_CONTEXT = [
  { label: 'Starbucks', value: 'merchant', subLabel: 'Merchant' },
  { label: 'Dining', value: 'category', subLabel: 'Category' },
  { label: 'Chase', value: 'account', subLabel: 'Account' }
]

function App() {
  const [amount, setAmount] = useState('0.00')
  const [mode, setMode] = useState('numpad') // 'numpad' | 'context'
  const [statusMsg, setStatusMsg] = useState('Ready')

  // ... (Effect) ...

  const handleDigit = (item) => {
    // If we receive an object (from new wheel), extract value
    const val = item.value || item

    if (mode === 'context') {
      setStatusMsg(`Editing ${item.label}...`)
      return
    }

    if (val === 'del') {
      const raw = amount.replace('.', '')
      const newRaw = raw.slice(0, -1)
      setAmount((parseInt(newRaw || '0') / 100).toFixed(2))
    } else {
      const raw = amount.replace('.', '') + val
      setAmount((parseInt(raw) / 100).toFixed(2))
    }
  }

  const handleCenterClick = async () => {
    if (mode === 'numpad') {
      if (amount === '0.00') return
      // TRANSITION TO CONTEXT
      setMode('context')
      setStatusMsg('Confirm Details')
      return
    }

    if (mode === 'context') {
      // SAVE TO DB
      try {
        await db.transactions.add({
          amount: parseFloat(amount),
          date: new Date(),
          status: 'review',
          merchant: 'Starbucks', // Mocked for now
          category: 'Dining'
        })

        // UX Feedback
        setStatusMsg(`Saved $${amount}!`)
        setTimeout(() => {
          setStatusMsg('Ready')
          setMode('numpad')
          setAmount('0.00')
        }, 1500)

      } catch (error) {
        console.error("Save failed", error)
        setStatusMsg("Error Saving!")
      }
    }
  }

  const currentItems = mode === 'numpad' ? NUMPAD_ITEMS : MOCK_CONTEXT

  return (
    <div className="app-container">
      {/* DETAILS AREA */}
      <div className="display-area">
        <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>v1.22 Context Mock</div>
        <div className="readout">
          <span className="currency">$</span>
          <span className="amount">{amount}</span>
        </div>
        <div style={{ color: 'lime', height: '20px' }}>{statusMsg}</div>
      </div>

      {/* ACTION WHEEL */}
      {/* CONTROLS AREA (Bottom) */}
      <div className="controls-area">
        {/* The Action Wheel Wrapper (320px) sits inside the controls area */}
        <div className="wheel-wrapper">
          <ActionWheel
            mode={mode}
            items={currentItems}
            onInput={handleDigit}
            onSave={handleCenterClick}
          />
          <button className="center-btn" onClick={handleCenterClick}>
            {mode === 'numpad' ? 'NEXT' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
