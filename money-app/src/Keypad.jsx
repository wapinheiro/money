import React from 'react'

export default function Keypad({ onDigit, onDelete }) {
    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '.', '0', 'C'
    ]

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px',
            width: '100%',
            maxWidth: '320px',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            {keys.map(k => (
                <button
                    key={k}
                    onClick={() => k === 'C' ? onDelete() : onDigit(k)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '70px',
                        height: '70px',
                        fontSize: '28px',
                        fontWeight: '500',
                        color: 'white',
                        margin: '0 auto',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                    }}
                    onTouchStart={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.3)'
                        try { navigator.vibrate(10) } catch (err) { }
                    }}
                    onTouchEnd={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.1)'
                    }}
                >
                    {k === 'C' ? '⌫' : k}
                </button>
            ))}
        </div>
    )
}
