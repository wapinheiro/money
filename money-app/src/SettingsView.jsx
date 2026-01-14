import React from 'react'

export default function SettingsView({
    onBack,
    currentTheme, onSetTheme,
    currentLayout, onSetLayout,
    currentHand, onSetHand
}) {

    // --- GESTURE HANDLER ---
    const [touchStart, setTouchStart] = React.useState(null)

    const handleTouchStart = (e) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }

    const handleTouchEnd = (e) => {
        if (!touchStart) return
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
        const deltaX = touchEnd.x - touchStart.x
        const deltaY = touchEnd.y - touchStart.y

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Swipe Left (<-) -> Back
            if (deltaX < -50) {
                onBack()
            }
        }
        setTouchStart(null)
    }

    const themes = [
        { id: 'midnight', name: 'Midnight', color: '#2E004B' },
        { id: 'daylight', name: 'Daylight', color: '#F2F2F7' },
        { id: 'oled', name: 'OLED', color: '#000000' },
        { id: 'sunset', name: 'Sunset', color: '#FF9500' },
    ]

    const layouts = [
        { id: 'standard', name: 'Standard' },
        { id: 'thumb', name: 'Big Wheel' },
        { id: 'visual', name: 'Big Display' },
    ]

    const hands = [
        { id: 'left', name: 'Left' },
        { id: 'center', name: 'Center' },
        { id: 'right', name: 'Right' },
    ]

    const ButtonGroup = ({ items, current, onSelect }) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '10px' }}>
            {items.map(item => (
                <button key={item.id} onClick={() => onSelect(item.id)} style={{
                    background: 'var(--card-bg)',
                    border: current === item.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                    borderRadius: '12px',
                    padding: '15px 10px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '14px'
                }}>
                    {item.name}
                </button>
            ))}
        </div>
    )

    return (
        <div className="settings-view"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
                width: '100%', height: '100%',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                display: 'flex', flexDirection: 'column',
                padding: '20px', paddingTop: '60px', boxSizing: 'border-box',
                overflowY: 'auto'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={onBack} style={{
                    background: 'none', border: 'none', fontSize: '24px', marginRight: '15px', cursor: 'pointer', color: 'var(--text-primary)'
                }}>←</button>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Settings</div>
            </div>

            {/* THEME SECTION */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '15px' }}>Appearance</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {themes.map(t => (
                        <button key={t.id} onClick={() => onSetTheme(t.id)} style={{
                            background: 'var(--card-bg)',
                            border: currentTheme === t.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                            borderRadius: '16px',
                            padding: '20px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: t.color, border: '1px solid #ccc',
                                marginBottom: '10px'
                            }}></div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ERGONOMICS SECTION */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '15px' }}>Ergonomics</div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>Wheel Size</div>
                    <ButtonGroup items={layouts} current={currentLayout} onSelect={onSetLayout} />
                </div>

                <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>Handedness</div>
                    <ButtonGroup items={hands} current={currentHand} onSelect={onSetHand} />
                </div>
            </div>

            <div style={{ flex: 1 }}></div>

            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', paddingBottom: '20px' }}>
                Money App v1.50 Ergo <br />
                Project Antigravity
            </div>
        </div>
    )
}
