import React, { useState, useEffect, useRef } from 'react'

export default function InputOverlay({
    title, placeholder, initialValue = '',
    onSave, onCancel,
    showTagOptions = false, initialTagData,
    showBillOptions = false, initialBillData
}) {
    const [value, setValue] = useState(initialValue)

    // Tag Specific State
    const [isTemp, setIsTemp] = useState(initialTagData?.type === 'temporary' || false)
    const [startDate, setStartDate] = useState(initialTagData?.startDate || new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(initialTagData?.endDate || '')

    // Bill Specific State
    const [billAmount, setBillAmount] = useState(initialBillData?.amount || '')
    const [billDay, setBillDay] = useState(initialBillData?.recurrenceDay || 1) // Day 1-31

    const inputRef = useRef(null)

    useEffect(() => {
        setValue(initialValue)
        if (initialTagData?.type) setIsTemp(initialTagData.type === 'temporary')
        if (initialTagData?.startDate) setStartDate(initialTagData.startDate)
        if (initialTagData?.endDate) setEndDate(initialTagData.endDate)

        if (initialBillData?.amount) setBillAmount(initialBillData.amount)
        if (initialBillData?.dueDate) setBillDate(initialBillData.dueDate)

        // Auto-focus with slight delay for animation
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus()
        }, 100)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValue]) // Only reset if initialValue changes (primitive). Ignore stable object changes to avoid loops.

    const handleSubmit = () => {
        if (!value.trim()) return

        if (showTagOptions) {
            onSave({
                name: value,
                type: isTemp ? 'temporary' : 'permanent',
                startDate: isTemp ? startDate : null,
                endDate: isTemp ? endDate : null
            })
        } else if (showBillOptions) {
            // Calculate next due date based on Day of Month
            const today = new Date()
            const currentYear = today.getFullYear()
            const currentMonth = today.getMonth() // 0-11
            const currentDay = today.getDate()

            let nextDue
            // If the bill day is in the future this month, set it for this month
            if (billDay >= currentDay) {
                nextDue = new Date(currentYear, currentMonth, billDay)
            } else {
                // Otherwise set it for next month
                nextDue = new Date(currentYear, currentMonth + 1, billDay)
            }

            // ISO String YYYY-MM-DD
            const dueDateString = nextDue.toISOString().split('T')[0]

            onSave({
                name: value,
                amount: parseFloat(billAmount || '0'),
                recurrenceDay: parseInt(billDay),
                dueDate: dueDateString,
                recurrence: 'monthly',
                status: 'unpaid'
            })
        } else {
            onSave(value)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit()
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', zIndex: 9999, // Fixed and High Z-Index
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '100px', // Safe for Keyboard
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                width: '90%', background: 'var(--card-bg)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                animation: 'fadeIn 0.2s ease-out',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-primary)' }}>
                    {title}
                </div>
                <input
                    ref={inputRef}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    style={{
                        width: '100%', padding: '15px', borderRadius: '12px',
                        border: '1px solid rgba(128,128,128,0.2)',
                        background: 'var(--bg-app)', color: 'var(--text-primary)',
                        fontSize: '18px', marginBottom: '20px', boxSizing: 'border-box',
                        outline: 'none'
                    }}
                />

                {showTagOptions && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <input
                                type="checkbox"
                                checked={isTemp}
                                onChange={e => setIsTemp(e.target.checked)}
                                style={{ width: '20px', height: '20px', marginRight: '10px' }}
                            />
                            <span style={{ fontSize: '16px' }}>Temporary Tag?</span>
                        </div>

                        {isTemp && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Start</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: 'white' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>End</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: 'white' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {showBillOptions && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Amount Due</label>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '20px', marginRight: '10px', color: '#888' }}>$</span>
                            <input
                                type="number"
                                value={billAmount}
                                onChange={e => setBillAmount(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    border: '1px solid rgba(128,128,128,0.3)',
                                    background: 'var(--bg-app)', color: 'var(--text-primary)',
                                    fontSize: '18px'
                                }}
                            />
                        </div>

                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Day of Month Due</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '16px', marginRight: '10px', color: '#888' }}>Every Month on the:</span>
                            <select
                                value={billDay}
                                onChange={e => setBillDay(parseInt(e.target.value))}
                                style={{
                                    padding: '10px', borderRadius: '8px',
                                    border: '1px solid rgba(128,128,128,0.3)',
                                    background: 'var(--bg-app)', color: 'var(--text-primary)',
                                    fontSize: '16px', flex: 1
                                }}
                            >
                                {[...Array(31).keys()].map(i => (
                                    <option key={i + 1} value={i + 1}>{i + 1}{
                                        (i + 1) === 1 ? 'st' : (i + 1) === 2 ? 'nd' : (i + 1) === 3 ? 'rd' : 'th'
                                    }</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '15px', borderRadius: '12px',
                        background: 'transparent', border: '1px solid rgba(128,128,128,0.3)',
                        color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer'
                    }}>Cancel</button>
                    <button onClick={handleSubmit} style={{
                        flex: 1, padding: '15px', borderRadius: '12px',
                        background: 'var(--accent-color)', border: 'none',
                        color: 'white', fontWeight: 'bold', cursor: 'pointer'
                    }}>Save</button>
                </div>
            </div>
        </div>
    )
}
