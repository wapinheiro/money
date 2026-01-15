import React from 'react'

export default function MenuView({ onSelect, onBack }) {
    const menuItems = [
        { id: 'manage_merchant', label: 'Merchants', icon: '🏪', color: '#FF9500' },
        { id: 'manage_category', label: 'Categories', icon: '📂', color: '#007AFF' },
        { id: 'manage_account', label: 'Accounts', icon: '💳', color: '#4CD964' },
    ]

    return (
        <div className="menu-view" style={{
            width: '100%', height: '100%',
            backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
            display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', marginTop: '40px' }}>
                <button onClick={onBack} style={{
                    background: 'none', border: 'none', fontSize: '24px', marginRight: '15px',
                    cursor: 'pointer', color: 'var(--text-primary)'
                }}>✕</button>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>Menu</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                {menuItems.map(item => (
                    <button key={item.id} onClick={() => onSelect(item.id)} style={{
                        background: 'var(--card-bg)', border: 'none', borderRadius: '20px',
                        padding: '20px', display: 'flex', alignItems: 'center',
                        fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer',
                        transition: 'transform 0.1s active'
                    }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '50%',
                            background: item.color + '22', color: item.color,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '24px', marginRight: '20px'
                        }}>{item.icon}</div>
                        {item.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1 }}></div>

            <button onClick={() => onSelect('settings')} style={{
                background: 'rgba(128,128,128,0.1)', border: 'none', borderRadius: '20px',
                padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)',
                cursor: 'pointer', marginBottom: '20px'
            }}>
                <span style={{ marginRight: '10px' }}>⚙️</span> Settings
            </button>
        </div>
    )
}
