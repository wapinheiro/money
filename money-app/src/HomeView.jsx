import { useState, useEffect } from 'react'
import { db } from './db'
import './App.css'

export default function HomeView({ onOpenCapture, onOpenSettings, grouping = 'category' }) {
    // Local Tab State (Initialized with Default)
    const [activeTab, setActiveTab] = useState(grouping)

    const [groupedData, setGroupedData] = useState([])
    const [budgetLeft, setBudgetLeft] = useState(2320.01) // Mock Budget/Calculated
    const [expandedCat, setExpandedCat] = useState(null)
    const [latestCatName, setLatestCatName] = useState(null)

    // Sync if Default changes
    useEffect(() => {
        setActiveTab(grouping)
    }, [grouping])

    // Live Query based on Active Tab
    useEffect(() => {
        fetchAndGroup()
    }, [activeTab]) // Re-run when tab changes

    const fetchAndGroup = async () => {
        const txs = await db.transactions.toArray()

        // Fetch Metadata based on Active Tab
        let metadata = []
        if (activeTab === 'category') metadata = await db.categories.toArray()
        else if (activeTab === 'account') metadata = await db.accounts.toArray()

        if (txs.length === 0) return

        // 1. Find Global Latest (for dot)
        txs.sort((a, b) => b.date - a.date)
        const latestTx = txs[0]
        setLatestCatName(activeTab === 'category' ? latestTx.category : latestTx.account)

        // 2. Group By Field
        const groups = {}
        txs.forEach(tx => {
            const key = activeTab === 'category' ? tx.category : tx.account

            if (!groups[key]) {
                // Find meta
                const meta = metadata.find(m => m.name === key) || { icon: '📦', color: '#666' }
                groups[key] = {
                    name: key,
                    icon: meta.icon || (activeTab === 'account' ? '💳' : '📂'),
                    color: meta.color || '#666',
                    total: 0,
                    count: 0,
                    transactions: [],
                    latestDate: new Date(0)
                }
            }
            const g = groups[key]
            g.total += tx.amount
            g.count += 1
            g.transactions.push(tx)
            if (tx.date > g.latestDate) g.latestDate = tx.date
        })

        // 3. Convert to Array & Sort by Latest Activity
        const groupArray = Object.values(groups).sort((a, b) => b.latestDate - a.latestDate)
        setGroupedData(groupArray)
    }

    const toggleExpand = (catName) => {
        setExpandedCat(expandedCat === catName ? null : catName)
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

            {/* CATEGORY GROUPS LIST */}
            <div style={{
                flex: 1,
                width: '100%',
                background: 'rgba(128,128,128, 0.05)',
                borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
                padding: '20px', boxSizing: 'border-box',
                overflowY: 'auto',
                paddingBottom: '120px' // Space for FAB
            }}>
                {/* TABS (Segmented Control) */}
                <div style={{
                    display: 'flex', background: 'rgba(128,128,128,0.1)',
                    borderRadius: '12px', padding: '4px', marginBottom: '20px'
                }}>
                    {[
                        // Dynamic Order: Default First
                        grouping === 'category' ? { id: 'category', label: 'Category' } : { id: 'account', label: 'Account' },
                        grouping === 'category' ? { id: 'account', label: 'Account' } : { id: 'category', label: 'Category' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '10px',
                                border: 'none', cursor: 'pointer',
                                background: activeTab === tab.id ? 'var(--card-bg)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                boxShadow: activeTab === tab.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {groupedData.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center' }}>No transactions yet</div>}

                    {groupedData.map(group => (
                        <div key={group.name} style={{
                            background: 'var(--card-bg)', borderRadius: '16px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                            overflow: 'hidden',
                            transition: 'all 0.2s'
                        }}>
                            {/* CATEGORY HEADER */}
                            <div
                                onClick={() => toggleExpand(group.name)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '15px',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Icon Bubble */}
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: group.color + '22', // Low opacity bg
                                        color: group.color,
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: '20px',
                                        position: 'relative'
                                    }}>
                                        {group.icon}

                                        {/* GREEN DOT INDICATOR */}
                                        {latestCatName === group.name && (
                                            <div style={{
                                                position: 'absolute', top: '-2px', right: '-2px',
                                                width: '10px', height: '10px',
                                                borderRadius: '50%',
                                                backgroundColor: '#00E676', // Vivid Green
                                                border: '2px solid var(--card-bg)', // Cutout effect
                                                boxShadow: '0 0 5px #00E676'
                                            }}></div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{group.name}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{group.count} transactions</span>
                                    </div>
                                </div>
                                <div style={{ fontWeight: '600', fontSize: '16px' }}>-${group.total.toFixed(2)}</div>
                            </div>

                            {/* ACCORDION CONTENT (Transactions) */}
                            {expandedCat === group.name && (
                                <div style={{
                                    borderTop: '1px solid rgba(128,128,128,0.1)',
                                    padding: '0 15px 15px 15px',
                                    background: 'rgba(0,0,0,0.02)'
                                }}>
                                    {group.transactions.map((tx, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            padding: '10px 0', fontSize: '14px',
                                            borderBottom: i === group.transactions.length - 1 ? 'none' : '1px solid rgba(128,128,128,0.05)'
                                        }}>
                                            <div style={{ color: 'var(--text-secondary)' }}>
                                                {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div style={{ flex: 1, marginLeft: '15px' }}>{tx.merchant}</div>
                                            <div style={{ fontWeight: '500' }}>{tx.amount.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* FLOATING ACTION BUTTON (Center Bottom) */}
            <div style={{
                position: 'absolute', bottom: '225px', left: '50%',
                transform: 'translateX(calc(-50% + var(--wheel-x-offset, 0px)))',
                transition: 'transform 0.3s',
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
