import { useState, useEffect } from 'react'
import { db } from './db'
import './App.css'

export default function HomeView({ onOpenCapture, onOpenSettings }) {
    const [recentTxs, setRecentTxs] = useState([])
    const [budgetLeft, setBudgetLeft] = useState(1240.00) // Mock Budget

    // Live Query for recent transactions
    useEffect(() => {
        fetchRecent()
    }, [])

    const fetchRecent = async () => {
        try {
            const txs = await db.transactions.toArray()
            setRecentTxs(txs.reverse().slice(0, 10))
        } catch (e) {
            console.error("Failed to load home", e)
        }
    }

    return (
        <div className="home-view" style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
            position: 'relative'
        }}>
            {/* HEADER */}
            <div style={{
                padding: '20px',
                paddingTop: '60px', /* Safe Area */
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '24px' }}>My Money</div>
                <button onClick={onOpenSettings} style={{
                    background: 'transparent', border: 'none',
                    fontSize: '24px', cursor: 'pointer'
                }}>⚙️</button>
            </div>

            {/* HERO: LEFT TO SPEND */}
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '20px', marginBottom: '10px'
            }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Safe to Spend
                </div>
                <div style={{ fontSize: '48px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    ${budgetLeft.toFixed(2)}
                </div>
                <div style={{
                    fontSize: '12px', color: 'var(--accent-color)',
                    background: 'rgba(76, 175, 80, 0.1)',
                    padding: '4px 10px', borderRadius: '10px', marginTop: '5px'
                }}>
                    On Track
                </div>
            </div>

            {/* RECENT ACTIVITY LIST */}
            <div style={{
                flex: 1,
                width: '100%',
                background: 'var(--bg-controls)', /* Contrast background for list? Or keep seamless? */
                background: 'rgba(128,128,128, 0.05)',
                borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
                padding: '20px', boxSizing: 'border-box',
                overflowY: 'auto'
            }}>
                <div style={{ fontWeight: '600', marginBottom: '15px', color: 'var(--text-secondary)' }}>Recent Activity</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {recentTxs.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center' }}>No transactions yet</div>}

                    {recentTxs.map(tx => (
                        <div key={tx.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '15px', background: 'var(--card-bg)', borderRadius: '16px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Icon Placeholder */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'var(--bg-app)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    fontSize: '20px'
                                }}>
                                    💳
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{tx.merchant}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(tx.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div style={{ fontWeight: '600' }}>-${tx.amount.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FLOATING ACTION BUTTON (Center Bottom) */}
            <div style={{
                position: 'absolute', bottom: '225px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 10
            }}>
                <button onClick={onOpenCapture} style={{
                    width: '70px', height: '70px', borderRadius: '50%',
                    background: 'var(--accent-color)', border: 'none',
                    color: 'white', fontSize: '36px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    +
                </button>
            </div>
        </div>
    )
}
