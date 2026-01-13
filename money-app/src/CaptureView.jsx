import { useState, useEffect } from 'react'
import { db } from './db'
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

// UTILS
function getContrastYIQ(hexcolor) {
    if (!hexcolor) return 'white';
    hexcolor = hexcolor.replace('#', '');
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

export default function CaptureView({ onClose }) {
    const [amount, setAmount] = useState('0.00')
    const [mode, setMode] = useState('numpad') // 'numpad' | 'context' | 'edit'
    const [statusMsg, setStatusMsg] = useState('Ready')
    const [contextItems, setContextItems] = useState([])

    /* State for Edit Mode */
    const [editTarget, setEditTarget] = useState(null) // 'merchant', 'category', 'account'
    const [editOptions, setEditOptions] = useState([])
    const [editIndex, setEditIndex] = useState(0)

    const handleDigit = (item) => {
        // If we receive an object (from new wheel), extract value
        const val = item.value || item

        // CONTEXT MODE: Tap to Edit
        if (mode === 'context') {
            const targetType = item.value
            setEditTarget(targetType)
            setMode('edit')
            setStatusMsg(`Select ${item.subLabel}`)

            // Load Options based on type
            async function loadOptions() {
                let options = []
                if (targetType === 'merchant') options = await db.merchants.toArray()
                else if (targetType === 'category') options = await db.categories.toArray()
                else if (targetType === 'account') options = await db.accounts.toArray()

                setEditOptions(options)
                setEditIndex(0) // Reset index or find current val
            }
            loadOptions()
            return
        }

        if (mode === 'edit') {
            // Tap on wheel in edit mode does nothing
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

    // --- INFINITE SPIN HANDLER ---
    const handleSpinChange = (direction) => {
        setEditIndex(prev => {
            let next = prev + direction
            if (next < 0) next = editOptions.length - 1
            if (next >= editOptions.length) next = 0
            return next
        })
    }

    // PREDICTION ENGINE (V1: Simple Fetch)
    const predictContext = async () => {
        const allMerchants = await db.merchants.toArray()
        const allCategories = await db.categories.toArray()
        const allAccounts = await db.accounts.toArray()

        if (allMerchants.length === 0) return []

        // Randomize Prediction for demo purposes
        const randomMerchant = allMerchants[Math.floor(Math.random() * allMerchants.length)]
        const associatedCategory = allCategories.find(c => c.id === randomMerchant.defaultCategoryId)

        // Pick first account or random
        const predictedAccount = allAccounts.length > 0
            ? allAccounts[Math.floor(Math.random() * allAccounts.length)]
            : { name: 'Cash', color: '#666' }

        return [
            {
                label: randomMerchant.name,
                value: 'merchant',
                subLabel: 'Merchant',
                // Rich Data
                logo: randomMerchant.logo,
                color: randomMerchant.color,
                meta: randomMerchant
            },
            {
                label: associatedCategory?.name || 'Uncategorized',
                value: 'category',
                subLabel: 'Category',
                logo: associatedCategory?.icon,
                color: associatedCategory?.color,
                meta: associatedCategory
            },
            {
                label: predictedAccount.name,
                value: 'account',
                subLabel: 'Account',
                color: predictedAccount.color,
                meta: predictedAccount
            }
        ]
    }

    const handleCenterClick = async () => {
        if (mode === 'numpad') {
            if (amount === '0.00') return

            // GENERATE PREDICTION
            const prediction = await predictContext()
            setContextItems(prediction)

            // TRANSITION TO CONTEXT
            setMode('context')
            setStatusMsg('Confirm Details')
            return
        }

        if (mode === 'edit') {
            if (!editOptions[editIndex]) return // Guard

            // CONFIRM SELECTION
            const selectedOption = editOptions[editIndex]

            // Update Context Items
            const newContext = contextItems.map(item => {
                if (item.value === editTarget) {
                    return { ...item, label: selectedOption.name, logo: selectedOption.logo || selectedOption.icon, color: selectedOption.color, meta: selectedOption }
                }
                return item
            })
            setContextItems(newContext)
            setMode('context')
            setEditTarget(null)
            setStatusMsg('Updated')
            return
        }

        if (mode === 'context') {
            // SAVE TO DB
            try {
                await db.transactions.add({
                    amount: parseFloat(amount),
                    date: new Date(),
                    status: 'review',
                    merchant: contextItems[0].label,
                    category: contextItems[1].label,
                    account: contextItems[2].label
                })

                // UX Feedback
                setStatusMsg(`Saved $${amount}!`)

                // EXIT STRATEGY: Wait a bit then Close
                setTimeout(() => {
                    if (onClose) onClose() // Return to Home
                }, 1000)

            } catch (error) {
                console.error("Save failed", error)
                setStatusMsg("Error Saving!")
            }
        }
    }

    const currentItems = mode === 'numpad' ? NUMPAD_ITEMS : contextItems

    // Determine current theme for contrast checks?
    // We can read data-theme from document if needed, but for now we rely on CSS vars mostly.
    // The Carousel needs JS logic for contrast.
    // We can grab it from document.documentElement.getAttribute('data-theme') inside the render if needed,
    // but let's assume 'midnight' contrast logic for 'edit' mode Carousels is robust enough or re-check.

    // --- GESTURE HANDLER (Swipe to Close on Center Button) ---
    const [touchStart, setTouchStart] = useState(null)

    const handleTouchStart = (e) => {
        // No need for y-check, we are on the button
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }

    const handleTouchEnd = (e) => {
        if (!touchStart) return

        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
        const deltaX = touchEnd.x - touchStart.x
        const deltaY = touchEnd.y - touchStart.y

        const MIN_SWIPE = 40 // slightly simpler on button

        // Logic: Prioritize dominant axis
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal: Swipe Left (<-) -> Back
            if (deltaX < -MIN_SWIPE) {
                if (onClose) onClose()
            }
        }
        setTouchStart(null)
    }

    return (
        <div
            className="capture-view"
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            {/* DETAILS AREA */}
            <div className="display-area">

                {/* VERSION LABEL */}
                <div style={{
                    position: 'absolute', top: '10px', left: '20px',
                    color: 'var(--text-secondary)', fontSize: '12px',
                    zIndex: 20, pointerEvents: 'none', opacity: 0.5
                }}>v1.44 Swipe Back</div>

                {mode === 'numpad' && (
                    <div className="readout">
                        <span className="currency">$</span>
                        <span className="amount">{amount}</span>
                    </div>
                )}

                {mode === 'context' && (
                    <div className="summary-card">
                        <div className="summary-amount">${amount}</div>

                        {/* DATE ROW */}
                        <div className="summary-row">
                            <span className="summary-label">Date</span>
                            <span className="summary-value" style={{ color: 'var(--text-primary)' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span style={{ width: '15px' }}></span>
                        </div>

                        {contextItems.map((item, i) => (
                            <div className="summary-row" key={i} onClick={() => handleDigit(item)}>
                                <span className="summary-label">{item.subLabel}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {/* LOGO BUBBLE */}
                                    {item.color && (
                                        <div style={{
                                            width: '12px', height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: item.color,
                                            boxShadow: '0 0 5px ' + item.color
                                        }}></div>
                                    )}

                                    {/* Simple Theme-Aware Text */}
                                    <span className="summary-value" style={{ color: item.color || 'var(--text-primary)' }}>
                                        {item.logo || '💳'} {item.label}
                                    </span>
                                </div>
                                <span style={{ color: '#666' }}> › </span>
                            </div>
                        ))}
                    </div>
                )}

                {mode === 'edit' && (
                    /* 3D CAROUSEL */
                    <div className="carousel-container" style={{ perspective: '1000px', height: '200px', position: 'relative' }}>
                        {editOptions.map((opt, i) => {
                            const offset = i - editIndex
                            if (Math.abs(offset) > 2) return null // Hide far items
                            const transform = `translate(-50%, -50%) translateY(${offset * 60}px) scale(${1 - Math.abs(offset) * 0.2})`
                            const opacity = 1 - Math.abs(offset) * 0.5
                            const bgColor = opt.color || '#333'
                            const fgColor = getContrastYIQ(bgColor)

                            return (
                                <div key={i} style={{
                                    position: 'absolute',
                                    top: '50%', left: '50%',
                                    transform: transform,
                                    opacity: opacity,
                                    background: bgColor,
                                    color: fgColor,
                                    padding: '20px',
                                    minWidth: '200px',
                                    textAlign: 'center',
                                    borderRadius: '12px',
                                    border: offset === 0 ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                                    transition: 'all 0.2s ease-out',
                                    zIndex: 10 - Math.abs(offset),
                                    boxShadow: offset === 0 ? `0 10px 30px ${bgColor}66` : 'none'
                                }}>
                                    <div style={{ fontSize: '32px', marginBottom: '5px' }}>{opt.logo || opt.icon}</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '20px', textShadow: fgColor === 'white' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
                                        {opt.name}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div style={{ color: 'lime', height: '20px', marginTop: '20px' }}>{statusMsg}</div>
            </div>

            {/* ACTION WHEEL */}
            <div className="controls-area">
                <div className="wheel-wrapper">
                    <ActionWheel
                        mode={mode}
                        items={currentItems}
                        onInput={handleDigit}
                        onSave={handleCenterClick}
                        onSpinChange={handleSpinChange}
                    />
                    <button
                        className="center-btn"
                        onClick={handleCenterClick}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {mode === 'numpad' ? 'NEXT' : (mode === 'edit' ? 'OK' : 'SAVE')}
                    </button>
                </div>
            </div>
        </div>
    )
}
