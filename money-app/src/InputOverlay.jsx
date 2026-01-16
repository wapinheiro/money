import React, { useState, useEffect, useRef } from 'react'

export default function InputOverlay({ title, placeholder, initialValue = '', onSave, onCancel }) {
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef(null)

    useEffect(() => {
        setValue(initialValue)
        // Auto-focus with slight delay for animation
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus()
        }, 100)
    }, [initialValue])

    const handleSubmit = () => {
        if (!value.trim()) return
        onSave(value)
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
