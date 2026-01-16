import React, { useState, useEffect } from 'react'
import { db } from './db'
import ActionWheel from './ActionWheel'
import Keypad from './Keypad' // NEW
import InputOverlay from './InputOverlay'
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

// REVIEW NAV INDICES
const NAV_FIELDS = ['amount', 'merchant', 'category', 'account', 'tags', 'save']

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

export default function CaptureView({ onClose, ergoAutoSwitch = false, defaultInput = 'wheel' }) {
    const [amount, setAmount] = useState('0.00')
    const [mode, setMode] = useState('numpad') // 'numpad' | 'context' | 'edit' | 'review_nav' | 'creation'
    // INPUT METHOD: 'wheel' | 'keypad'
    const [inputMethod, setInputMethod] = useState(defaultInput)

    const [statusMsg, setStatusMsg] = useState('Ready')
    const [contextItems, setContextItems] = useState([])
    const [selectedTags, setSelectedTags] = useState([]) // New State for Tags

    /* State for Review Nav */
    const [reviewFocus, setReviewFocus] = useState(1) // Default start at 1 (Merchant)

    /* State for Edit Mode */
    const [editTarget, setEditTarget] = useState(null) // 'merchant', 'category', 'account', 'tags'
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
                const createOption = { id: 'NEW', name: '+ Create New', icon: '➕', color: '#888' }

                if (targetType === 'merchant') options = await db.merchants.toArray()
                else if (targetType === 'category') options = await db.categories.toArray()
                else if (targetType === 'account') options = await db.accounts.toArray()

                // Prepend Create New
                options = [createOption, ...options]

                setEditOptions(options)
                setEditIndex(0) // Reset index
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
        if (mode === 'review_nav') {
            setReviewFocus(prev => {
                let next = prev + direction
                if (next < 0) next = NAV_FIELDS.length - 1
                if (next >= NAV_FIELDS.length) next = 0
                return next
            })
        }
        else if (mode === 'edit') {
            if (editTarget === 'amount') {
                // Skip amount edit via wheel for now, return to numpad logic handled in click
                return
            }
            setEditIndex(prev => {
                let next = prev + direction
                if (next < 0) next = editOptions.length - 1
                if (next >= editOptions.length) next = 0
                return next
            })
        }
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

            // TRANSITION TO REVIEW NAV (Default focus: SAVE)
            setMode('review_nav')
            setReviewFocus(4)
            setStatusMsg('Review Details')

            // AUTO-SWITCH TO TH (KEYPAD/DIRECT EDIT) IF ENABLED
            if (ergoAutoSwitch) {
                setInputMethod('keypad')
            }
            return
        }

        if (mode === 'review_nav') {
            const focusedField = NAV_FIELDS[reviewFocus]

            if (focusedField === 'save') {
                // SAVE TO DB
                try {
                    await db.transactions.add({
                        amount: parseFloat(amount),
                        date: new Date(),
                        status: 'review',
                        merchant: contextItems[0].label,
                        category: contextItems[1].label,
                        account: contextItems[2].label,
                        tags: selectedTags.map(t => t.id) // Save Tag IDs
                    })
                    setStatusMsg(`Saved $${amount}!`)
                    setTimeout(() => { if (onClose) onClose() }, 1000)
                } catch (error) {
                    console.error("Save failed", error)
                }
                return
            }

            // EDIT ACTION
            setEditTarget(focusedField)

            if (focusedField === 'amount') {
                setMode('numpad') // Return to Numpad for amount
                return
            }

            // For other fields, Enter Edit Mode
            setMode('edit')
            setStatusMsg(`Select ${focusedField}`)

            let options = []
            const createOption = { id: 'NEW', name: '+ Create New', icon: '➕', color: '#888' }

            if (focusedField === 'merchant') options = await db.merchants.toArray()
            else if (focusedField === 'category') options = await db.categories.toArray()
            else if (focusedField === 'account') options = await db.accounts.toArray()
            else if (focusedField === 'tags') {
                const allTags = await db.tags.toArray()
                // Filter Active Tags
                const now = new Date()
                options = allTags.filter(t => {
                    if (!t.endDate) return true; // Permanent
                    const start = new Date(t.startDate)
                    const end = new Date(t.endDate)
                    return now >= start && now <= end;
                })
            }

            // Prepend Create New (ONLY IN KEYPAD MODE)
            if (inputMethod === 'keypad') {
                options = [createOption, ...options]
            }

            setEditOptions(options)
            setEditIndex(0)
            return
        }

        if (mode === 'edit') {
            if (!editOptions[editIndex]) return // Guard

            // SPECIAL CASE: TAGS (Multi-Select)
            if (editTarget === 'tags') {
                handleTagToggle(editOptions[editIndex])
                return // Don't close edit mode automatically? Or do we? 
                // For Keypad/Grid mode, maybe we stay open until they hit "OK".
                // For Wheel mode, clicking center usually means "Select & Close".
                // Let's assume for now clicking center on Wheel toggles it. 
                // User must use "Back" or "Next" to exit? 
                // Actually in 'edit' mode, Center click is "Save/Confirm". 
                // If it's multi-select, Center click should probably just toggle.
                // But how do they "Finish"?
                // The "OK" button (which is the Center button styling) handles the `handleCenterClick`.
                // So if we are here, they clicked the center button.
                // Wait, `handleCenterClick` IS the center button.
                // So if they are in 'edit' mode and click Center, it confirms selection.

                // For Wheel: Center Click = Select the ITEM focused by the wheel. 
                // So yes, toggle that item. 
                // But then how to leave? 
                // Maybe "OK" (Center Button) implies "I'm done with this screen".
                // Ah, this logic at line 240 is confusing for Multi-Select. 
                // Let's say Center Click selects the focused item. 
                // If multiselect, we should toggle it and maybe show a toast "Tag Added".
                // But then they are still in edit mode.
                // We need a way to "Finish". 
                // The Swipe down gesture `handleTouchEnd` handles "Back".

                // Let's make Wheel Center Click = Toggle & Stay.
                handleTagToggle(editOptions[editIndex])
                setStatusMsg(selectedTags.some(t => t.id === editOptions[editIndex].id) ? 'Tag Removed' : 'Tag Added')
                return
            }

            // CONFIRM SELECTION (Single Select Types)
            const selectedOption = editOptions[editIndex]

            // Update Context Items
            const newContext = contextItems.map(item => {
                if (item.value === editTarget) {
                    return { ...item, label: selectedOption.name, logo: selectedOption.logo || selectedOption.icon, color: selectedOption.color, meta: selectedOption }
                }
                return item
            })
            setContextItems(newContext)

            // RETURN TO REVIEW NAV
            setMode('review_nav')
            setEditTarget(null)
            setStatusMsg('Updated')
            return
        }
    } // END handleCenterClick

    // ACTIONS
    const handleCreateNew = async (name) => {
        const table = editTarget === 'merchant' ? db.merchants :
            editTarget === 'category' ? db.categories :
                editTarget === 'account' ? db.accounts : db.tags

        // Basic Defaults
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#FF00CC', '#00FFCC']
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        const defaultIcon = editTarget === 'merchant' ? '🏪' : editTarget === 'category' ? '🏷️' : editTarget === 'account' ? '🏦' : '🔖'

        const newItem = {
            name: name,
            icon: defaultIcon, // Tags might not use icons, but schema supports it if we add it
            type: 'permanent', // Default to permanent for quick create
            color: randomColor
        }

        try {
            const id = await table.add(newItem)
            if (editTarget === 'tags') {
                // For Tags, we toggle it ON
                handleTagToggle({ ...newItem, id })
                setMode('review_nav') // Return after creation
            } else {
                handleOptionClick({ ...newItem, id })
            }
        } catch (e) {
            console.error("Creation failed", e)
            setStatusMsg('Error creating item')
        }
    }

    // HELPER: Tag Toggle (Multi-Select)
    const handleTagToggle = (tag) => {
        if (tag.id === 'NEW') {
            setMode('creation')
            return
        }

        const alreadySelected = selectedTags.some(t => t.id === tag.id)
        let newTags
        if (alreadySelected) {
            newTags = selectedTags.filter(t => t.id !== tag.id)
        } else {
            newTags = [...selectedTags, tag]
        }
        setSelectedTags(newTags)
        // Stay in Edit Mode to allow multiple selections? 
        // Or user clicks "OK" to finish.
        // Let's rely on the "OK" button in the grid/wheel interface to exit.
    }

    // HELPER: Confirm Selection (Direct Click)
    const handleOptionClick = (option) => {
        // Handle Create New
        if (option.id === 'NEW') {
            setMode('creation') // Switch to Creation Mode
            return
        }

        const newContext = contextItems.map(item => {
            if (item.value === editTarget) {
                return { ...item, label: option.name, logo: option.logo || option.icon, color: option.color, meta: option }
            }
            return item
        })
        setContextItems(newContext)
        setMode('review_nav')
        setEditTarget(null)
        setStatusMsg('Updated')
    } // End handleOptionClick

    const currentItems = mode === 'numpad' ? NUMPAD_ITEMS : contextItems

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
                // If in Edit mode, go back to Review Nav
                if (mode === 'edit') {
                    setMode('review_nav')
                } else if (mode === 'review_nav') {
                    // Go back to Numpad
                    setMode('numpad')
                } else {
                    if (onClose) onClose()
                }
            }
        }
        setTouchStart(null)
    }

    // Helper for Highlight Styles
    const getHighlightStyle = (fieldName) => {
        if (mode === 'review_nav' && NAV_FIELDS[reviewFocus] === fieldName) {
            return {
                border: '2px solid var(--accent-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.02)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
        }
        return { border: '2px solid transparent' } // Invisible border to prevent layout shift
    }

    // Dynamic Button Label
    const getButtonLabel = () => {
        if (mode === 'numpad') return 'NEXT'
        if (mode === 'edit') return 'OK'

        // Review Nav
        const focusField = NAV_FIELDS[reviewFocus]
        if (focusField === 'save') return 'SAVE'
        return 'EDIT'
    }

    // BACK ACTION
    const handleBack = () => {
        if (mode === 'edit') {
            setMode('review_nav')
            setEditTarget(null)
        } else if (mode === 'review_nav') {
            setMode('numpad')
        } else {
            if (onClose) onClose()
        }
    }

    return (
        <div
            className="capture-view"
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            {/* DETAILS AREA */}
            <div className="display-area">

                {/* NAVIGATION BUTTON (Back / Close) - TH MODE ONLY */}
                {inputMethod === 'keypad' && (
                    <button
                        onClick={handleBack}
                        style={{
                            position: 'absolute', top: '20px', left: '20px',
                            background: 'var(--card-bg)', // Solid background
                            border: '2px solid rgba(128,128,128,0.2)',
                            borderRadius: '50%',
                            width: '50px', height: '50px', // Larger
                            color: 'var(--text-primary)', // High contrast
                            fontSize: '24px', fontWeight: 'bold',
                            zIndex: 100, cursor: 'pointer',
                            pointerEvents: 'auto', // FIX: Enable Clicks
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)' // Prominent Shadow
                        }}
                    >
                        {mode === 'numpad' ? '✕' : '←'}
                    </button>
                )}



                {mode === 'numpad' && (
                    <div className="readout" style={{ color: 'var(--accent-color)', fontWeight: 'normal' }}>
                        <span className="currency">$</span>
                        <span className="amount">{amount}</span>
                    </div>
                )}

                {/* SHOW SUMMARY CARD FOR REVIEW NAV AND EDIT MODES */}
                {(mode === 'review_nav' || mode === 'edit') && (
                    <div className="summary-card">

                        {/* AMOUNT ROW (Editable only in Keypad Mode) */}
                        <div
                            className="summary-amount"
                            onClick={() => {
                                if (inputMethod === 'keypad') {
                                    setEditTarget('amount')
                                    setMode('numpad')
                                }
                            }}
                            style={{
                                ...getHighlightStyle('amount'),
                                padding: '5px 10px', borderRadius: '12px', transition: 'all 0.2s',
                                display: 'block', width: '100%', textAlign: 'center', // CENTERED
                                cursor: inputMethod === 'keypad' ? 'pointer' : 'default',
                                color: 'var(--accent-color)', fontWeight: 'normal' // Green, Regular
                            }}
                        >
                            ${amount}
                        </div>

                        {/* DATE ROW */}
                        <div className="summary-row">
                            <span className="summary-label">Date</span>
                            <span className="summary-value" style={{ color: 'var(--text-primary)' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span style={{ width: '15px' }}></span>
                        </div>

                        {contextItems.map((item, i) => (
                            <div
                                className="summary-row"
                                key={i}
                                onClick={async () => {
                                    if (inputMethod !== 'keypad') return

                                    // DIRECT EDIT LOGIC
                                    setEditTarget(item.value)
                                    setMode('edit')
                                    setStatusMsg(`Select ${item.subLabel}`)

                                    // Load Options & Deduplicate
                                    let options = []
                                    const createOption = { id: 'NEW', name: '+ Create New', icon: '➕', color: '#888' }

                                    if (item.value === 'merchant') options = await db.merchants.toArray()
                                    else if (item.value === 'category') options = await db.categories.toArray()
                                    else if (item.value === 'account') options = await db.accounts.toArray()

                                    // Simple Dedupe by Name
                                    const seen = new Set()
                                    options = options.filter(o => {
                                        if (seen.has(o.name)) return false
                                        seen.add(o.name)
                                        return true
                                    })

                                    // Prepend Create New (ONLY IN KEYPAD MODE)
                                    const shouldUseKeypad = inputMethod === 'keypad' || ergoAutoSwitch
                                    if (shouldUseKeypad) {
                                        options = [createOption, ...options]
                                    }

                                    setEditOptions(options)
                                    setEditIndex(0)
                                }}
                                style={{
                                    ...getHighlightStyle(item.value),
                                    transition: 'all 0.2s', paddingLeft: '5px', paddingRight: '5px', borderRadius: '8px',
                                    cursor: inputMethod === 'keypad' ? 'pointer' : 'default'
                                }}
                            >
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


                        {/* TAGS ROW */}
                        <div className="summary-row"
                            onClick={async () => {
                                if (inputMethod !== 'keypad') return

                                setEditTarget('tags')
                                setMode('edit')
                                setStatusMsg('Select Tags')

                                const allTags = await db.tags.toArray()
                                // Filter Active Tags
                                const now = new Date()
                                const activeTags = allTags.filter(t => {
                                    if (!t.endDate) return true; // Permanent
                                    const start = new Date(t.startDate)
                                    const end = new Date(t.endDate)
                                    return now >= start && now <= end;
                                })

                                // Helper: Sort Temporary First
                                activeTags.sort((a, b) => {
                                    const nameA = a.name || ''
                                    const nameB = b.name || ''
                                    if (a.type === b.type) return nameA.localeCompare(nameB)
                                    return a.type === 'temporary' ? -1 : 1
                                })

                                const createOption = { id: 'NEW', name: '+ New', icon: '➕', color: '#888' }
                                const options = [createOption, ...activeTags]
                                setEditOptions(options)
                            }}
                            style={{
                                ...getHighlightStyle('tags'),
                                transition: 'all 0.2s', paddingLeft: '5px', paddingRight: '5px', borderRadius: '8px',
                                cursor: inputMethod === 'keypad' ? 'pointer' : 'default',
                                marginTop: '5px', borderTop: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <span className="summary-label">Tags</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                                {selectedTags.length === 0 ? (
                                    <span style={{ color: '#666', fontSize: '12px' }}>+ Add Tags</span>
                                ) : (
                                    selectedTags.map(tag => (
                                        <span key={tag.id} style={{
                                            background: tag.color || '#666',
                                            color: getContrastYIQ(tag.color || '#666'),
                                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px'
                                        }}>
                                            #{tag.name}
                                        </span>
                                    ))
                                )}
                            </div>
                            <span style={{ color: '#666', marginLeft: '10px' }}> › </span>
                        </div>
                    </div>
                )}

                {(mode === 'edit' && inputMethod === 'wheel') && (
                    /* 3D CAROUSEL (Absolute Overlay) - WHEEL ONLY */
                    <div className="carousel-container" style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '0',
                        width: '100%',
                        height: '200px',
                        perspective: '1000px',
                        zIndex: 50 // Ensure it's on top
                    }}>
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

            {/* ACTION WHEEL OR KEYPAD */}
            <div className="controls-area" style={{ position: 'relative' }}>

                {/* INPUT METHOD TOGGLE (Available in Numpad AND Review Nav) */}
                {(mode === 'numpad' || mode === 'review_nav') && (
                    <button
                        onClick={() => setInputMethod(prev => prev === 'wheel' ? 'keypad' : 'wheel')}
                        style={{
                            position: 'absolute',
                            top: '20px', // Moved to TOP
                            right: '25px',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '24px',
                            cursor: 'pointer',
                            zIndex: 100 // High Z-Index
                        }}
                    >
                        {inputMethod === 'wheel' ? '⌨️' : '🎡'}
                    </button>
                )}

                {(mode === 'numpad' && inputMethod === 'keypad') ? (
                    <div style={{ paddingBottom: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <Keypad
                            onDigit={handleDigit}
                            onDelete={() => handleDigit({ value: 'del' })}
                        />
                        {/* STANDALONE NEXT BUTTON */}
                        <button
                            onClick={handleCenterClick}
                            style={{
                                position: 'absolute',
                                bottom: '20px',
                                right: '50%', transform: 'translateX(50%)',
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'var(--accent-color)',
                                border: '4px solid #1a1a1a',
                                color: 'white', fontWeight: 'bold',
                                zIndex: 15,
                                fontSize: '16px'
                            }}
                        >
                            NEXT
                        </button>
                    </div>
                )

                    /* TH REVIEW MODE (Direct Edit + Big Save Button) */
                    : (mode === 'review_nav' && inputMethod === 'keypad') ? (
                        <div style={{ paddingBottom: '40px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                                onClick={handleCenterClick}
                                style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    background: 'var(--accent-color)',
                                    border: '4px solid #1a1a1a',
                                    color: 'white', fontWeight: 'bold',
                                    zIndex: 15,
                                    fontSize: '24px',
                                    boxShadow: '0 5px 20px rgba(76, 175, 80, 0.4)'
                                }}
                            >
                                SAVE
                            </button>
                        </div>
                    )

                        /* TH EDIT MODE (GRID SELECTION) */
                        : (mode === 'edit' && inputMethod === 'keypad') ? (
                            <div style={{
                                width: '100%', height: '100%',
                                padding: '10px 20px 40px 20px',
                                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px',
                                overflowY: 'auto', alignContent: 'start'
                            }}>
                                {Array.isArray(editOptions) && editOptions.map((opt, i) => {
                                    const prev = editOptions[i - 1]
                                    let showHeader = false
                                    let headerTitle = ''

                                    // Header Logic
                                    // Header Logic
                                    if (editTarget === 'tags' && opt) {
                                        // Case 1: First item is Temporary -> "Temporary Tags"
                                        if (i === 1 && opt.type === 'temporary') {
                                            showHeader = true; headerTitle = 'Temporary Tags'
                                        }
                                        // Case 2: Item is Permanent, and Previous was either "New" or "Temporary" -> "Permanent Tags"
                                        else if (opt.type === 'permanent' && (!prev || prev.id === 'NEW' || prev.type === 'temporary')) {
                                            showHeader = true; headerTitle = 'Permanent Tags'
                                        }
                                    }

                                    return (
                                        <React.Fragment key={i}>
                                            {showHeader && (
                                                <div style={{
                                                    gridColumn: '1 / -1',
                                                    color: 'var(--accent-color)', // Changed to Accent for better visibility
                                                    fontSize: '12px', fontWeight: 'bold',
                                                    marginTop: '15px', marginBottom: '5px',
                                                    textTransform: 'uppercase', letterSpacing: '1px',
                                                    paddingLeft: '5px'
                                                }}>
                                                    {headerTitle}
                                                </div>
                                            )}
                                            <button onClick={() => editTarget === 'tags' ? handleTagToggle(opt) : handleOptionClick(opt)} style={{
                                                background: (editTarget === 'tags' && selectedTags.some(t => t.id === opt.id)) ? 'var(--accent-color)' : // Highlight Selected
                                                    opt.color ? `${opt.color}33` : '#333',
                                                border: (editTarget === 'tags' && selectedTags.some(t => t.id === opt.id)) ? '2px solid white' :
                                                    `2px solid ${opt.color || '#555'}`,
                                                color: (editTarget === 'tags' && selectedTags.some(t => t.id === opt.id)) ? 'white' : 'var(--text-primary)',
                                                borderRadius: '12px', fontSize: '16px', fontWeight: 'bold',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                padding: '15px', minHeight: '80px'
                                            }}>
                                                <div style={{ fontSize: '28px', marginBottom: '5px' }}>{opt.logo || opt.icon}</div>
                                                {opt.name}
                                            </button>
                                        </React.Fragment>
                                    )
                                })}
                                <button onClick={() => {
                                    setMode('review_nav')
                                    setReviewFocus(5) // Auto-advance to SAVE
                                }} style={{
                                    gridColumn: 'span 2', background: '#333', color: 'white',
                                    border: '1px solid #555', borderRadius: '12px', padding: '15px'
                                }}>
                                    DONE
                                </button>
                            </div>
                        )

                            /* WHEEL MODE (Default) */
                            : (
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
                                        style={{
                                            background: (mode === 'review_nav' && NAV_FIELDS[reviewFocus] === 'save') ? 'var(--accent-color)' :
                                                (mode === 'review_nav' && NAV_FIELDS[reviewFocus] !== 'save') ? '#444' :
                                                    'var(--accent-color)'
                                        }}
                                    >
                                        {getButtonLabel()}
                                    </button>
                                </div>
                            )}
            </div>

            {/* CREATION OVERLAY (Moved to Root) */}
            {mode === 'creation' && (
                <InputOverlay
                    title={`New ${editTarget}`}
                    placeholder={`Name for new ${editTarget}...`}
                    onSave={handleCreateNew}
                    onCancel={() => setMode('edit')}
                    showTagOptions={editTarget === 'tags'}
                />
            )}
        </div>
    )
}
