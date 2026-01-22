import React, { useState, useEffect } from 'react'
import { db } from './db'
import InputOverlay from './InputOverlay'

export default function BudgetView({ onBack }) {
    const [bills, setBills] = useState([])
    const [budgets, setBudgets] = useState([])

    // Toggles for UI keying
    const [viewMode, setViewMode] = useState('planning') // 'planning' | 'management'
    const [showAddBill, setShowAddBill] = useState(false)
    const [showAddBudget, setShowAddBudget] = useState(false) // NEW: Budget Modal
    const [editingBill, setEditingBill] = useState(null)
    const [editingBudget, setEditingBudget] = useState(null) // NEW: Edit Budget
    const [budgetProgress, setBudgetProgress] = useState({}) // IDs -> { spent, total, label }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const allBills = await db.bills.toArray()
        const allBudgets = await db.budgets.toArray()
        // Sort bills by due date
        allBills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        setBills(allBills)
        setBudgets(allBudgets)

        // CALCULATE BUDGET PROGRESS
        const progressMap = {}
        const now = new Date()

        for (const b of allBudgets) {
            // Determine Range
            let start, end, label
            if (b.period === 'weekly') {
                // Start of week (Sunday)
                const day = now.getDay()
                start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0)
                end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
                label = 'This Week'
            } else if (b.period === 'monthly') {
                start = new Date(now.getFullYear(), now.getMonth(), 1)
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                label = 'This Month'
            } else if (b.period === 'yearly') {
                start = new Date(now.getFullYear(), 0, 1)
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
                label = 'This Year'
            } else if (b.period === 'custom' && b.startDate && b.endDate) {
                start = new Date(b.startDate)
                end = new Date(b.endDate); end.setHours(23, 59, 59, 999)
                label = `${b.startDate.slice(5)} to ${b.endDate.slice(5)}`
            } else {
                // Fallback
                start = new Date(0)
                end = new Date()
                label = 'Unknown'
            }

            // Query Transactions
            // Note: DEXIE doesn't do complex ORs easily, so we filter in JS for now or simple range
            const txs = await db.transactions
                .where('date')
                .between(start.getTime(), end.getTime(), true, true)
                .toArray()

            // Filter by Category (Scope)
            const relevantTxs = txs.filter(tx => {
                if (b.type === 'category') return tx.category === (allCategoriesMap[b.scopeId] || tx.category) // We need ID match or name match? 
                // Wait, transactions store Category NAME string currently, but budgets store scopeID. 
                // We need to resolve ID -> Name.
                return true
            })
            // ACTUALLY: Transaction stores Category NAME. Budget stores ScopeID.
            // We need a map.
            // Rollover Logic
            let totalLimit = b.limit
            let totalSpent = 0

            if (b.isRollover && b.rolloverStartDate) {
                // ROLLEOVER CALCULATIONS
                // 1. Calculate how many full periods have passed since Start Date
                const rStart = new Date(b.rolloverStartDate)
                const now = new Date()

                // Diff in time
                const diffTime = Math.abs(now - rStart)
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                let periodsElapsed = 1
                if (b.period === 'weekly') periodsElapsed = Math.ceil(diffDays / 7)
                if (b.period === 'monthly') periodsElapsed = ((now.getFullYear() - rStart.getFullYear()) * 12) + (now.getMonth() - rStart.getMonth()) + 1
                if (b.period === 'yearly') periodsElapsed = (now.getFullYear() - rStart.getFullYear()) + 1

                if (periodsElapsed < 1) periodsElapsed = 1

                // 2. Cumulative Limit
                totalLimit = b.limit * periodsElapsed

                // 3. Cumulative Spent (Query everything since rolloverStartDate)
                const allTxs = await db.transactions
                    .where('date')
                    .aboveOrEqual(rStart.getTime())
                    .toArray()

                let scopeName = null
                if (b.type === 'tag' && b.scopeId) {
                    const tag = await db.tags.get(b.scopeId)
                    if (tag) scopeName = tag.name
                } else if (b.scopeId) {
                    // Default Category
                    const cat = await db.categories.get(b.scopeId)
                    if (cat) scopeName = cat.name
                }

                if (b.type === 'tag') {
                    totalSpent = allTxs
                        .filter(tx => scopeName && Array.isArray(tx.tags) && tx.tags.includes(scopeName))
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    label = `Rollover Active (${periodsElapsed} periods) - Tag: ${scopeName}`
                } else {
                    totalSpent = allTxs
                        .filter(tx => scopeName && tx.category === scopeName)
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    label = `Rollover Active (${periodsElapsed} periods)`
                }

            } else {
                // STANDARD PERIOD CALCULATION
                let scopeName = null
                if (b.type === 'tag' && b.scopeId) {
                    const tag = await db.tags.get(b.scopeId)
                    if (tag) scopeName = tag.name
                } else if (b.scopeId) {
                    const cat = await db.categories.get(b.scopeId)
                    if (cat) scopeName = cat.name
                }

                if (b.type === 'tag') {
                    totalSpent = txs
                        .filter(tx => scopeName && Array.isArray(tx.tags) && tx.tags.includes(scopeName))
                        .reduce((sum, tx) => sum + tx.amount, 0)
                } else {
                    totalSpent = txs
                        .filter(tx => scopeName && tx.category === scopeName)
                        .reduce((sum, tx) => sum + tx.amount, 0)
                }
            }

            // Final Progress Entry
            let scopeName = null
            if (b.type === 'tag' && b.scopeId) {
                const tag = await db.tags.get(b.scopeId)
                if (tag) scopeName = tag.name
            } else if (b.scopeId) {
                const cat = await db.categories.get(b.scopeId)
                if (cat) scopeName = cat.name
            }

            progressMap[b.id] = { spent: totalSpent, total: totalLimit, label, categoryName: scopeName, notes: b.notes }
        }
        setBudgetProgress(progressMap)
    }

    const handleSaveBill = async (billData) => {
        try {
            if (editingBill) {
                console.log("Updating Bill:", billData)
                await db.bills.update(editingBill.id, billData)
                setEditingBill(null)
            } else {
                console.log("Adding Bill:", billData)
                await db.bills.add(billData)
                setShowAddBill(false)
            }
            loadData()
        } catch (error) {
            console.error("Failed to save bill:", error)
            alert("Error saving bill: " + error.message)
        }
    }

    const toggleBillStatus = async (bill) => {
        // Toggle Unpaid <-> Paid (Simple Boolean for v1 MVP)
        // Future: Partial Logic
        const newStatus = bill.status === 'paid' ? 'unpaid' : 'paid'
        await db.bills.update(bill.id, { status: newStatus })
        loadData()
    }

    const deleteBill = async (id) => {
        if (!window.confirm("Delete this bill?")) return
        await db.bills.delete(id)
        loadData()
    }

    // BUDGET ACTIONS
    const handleSaveBudget = async (budgetData) => {
        if (editingBudget) {
            await db.budgets.update(editingBudget.id, budgetData)
            setEditingBudget(null)
        } else {
            await db.budgets.add(budgetData)
            setShowAddBudget(false)
        }
        loadData()
    }

    const deleteBudget = async (id) => {
        if (!window.confirm("Delete this budget?")) return
        await db.budgets.delete(id)
        loadData()
    }

    return (
        <div className="budget-view" style={{
            width: '100%', height: '100%',
            background: 'var(--bg-app)', color: 'var(--text-primary)',
            display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingTop: '40px' }}>
                <button onClick={onBack} style={{
                    background: 'none', border: 'none', fontSize: '24px', marginRight: '15px',
                    cursor: 'pointer', color: 'var(--text-primary)'
                }}>←</button>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Planning</div>
            </div>

            {/* Placeholder Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingBottom: '100px' }}>

                {/* Bills Section */}
                <div className="section-bills" style={{ background: 'rgba(128,128,128,0.05)', padding: '15px', borderRadius: '20px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Bills to Pay</span>
                        <button onClick={() => setShowAddBill(true)} style={{
                            background: 'var(--accent-color)', border: 'none', borderRadius: '8px',
                            color: 'white', fontWeight: 'bold', padding: '5px 10px', fontSize: '12px'
                        }}>+ ADD BILL</button>
                    </div>

                    {bills.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                            No bills set up yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {bills.map(bill => (
                                <div key={bill.id} style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '12px', background: 'var(--card-bg)', borderRadius: '12px',
                                    opacity: bill.status === 'paid' ? 0.6 : 1
                                }}>
                                    <div
                                        onClick={() => toggleBillStatus(bill)}
                                        style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            border: `2px solid ${bill.status === 'paid' ? 'var(--accent-color)' : '#666'}`,
                                            background: bill.status === 'paid' ? 'var(--accent-color)' : 'transparent',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            marginRight: '15px', cursor: 'pointer', color: 'white', fontSize: '14px',
                                            zIndex: 10 // Ensure click target is above row
                                        }}
                                    >
                                        {bill.status === 'paid' && '✓'}
                                    </div>

                                    {/* Edit Wrapper: Name & Amount */}
                                    <div
                                        onClick={() => setEditingBill(bill)}
                                        style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '16px', fontWeight: '600',
                                                textDecoration: bill.status === 'paid' ? 'line-through' : 'none'
                                            }}>
                                                {bill.name}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#888' }}>
                                                Due: {bill.dueDate}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '10px' }}>
                                            ${bill.amount.toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Delete Button (Outside Edit Wrapper) */}
                                    <button onClick={(e) => {
                                        e.stopPropagation() // Prevent Edit trigger
                                        deleteBill(bill.id)
                                    }} style={{
                                        background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                                        padding: '5px'
                                    }}>x</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Budgets Section */}
                <div className="section-budgets" style={{ background: 'rgba(128,128,128,0.05)', padding: '15px', borderRadius: '20px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Budgets (Targets)</div>
                    <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        No budgets set up yet.
                    </div>
                </div>

            </div>

            {/* INPUT OVERLAY */}
            {showAddBill && (
                <InputOverlay
                    title="New Bill"
                    placeholder="Bill Name (e.g. Rent)"
                    showBillOptions={true}
                    onSave={handleSaveBill}
                    onCancel={() => setShowAddBill(false)}
                />
            )}
            {/* BUDGETS SECTION */}
            <div className="section-budgets" style={{ padding: '15px', borderRadius: '20px', marginTop: '20px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Budgets</span>
                    <button onClick={() => setShowAddBudget(true)} style={{
                        background: 'var(--accent-color)', border: 'none', borderRadius: '8px',
                        color: 'white', fontWeight: 'bold', padding: '5px 10px', fontSize: '12px'
                    }}>+ CREATE</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {budgets.map(b => {
                        const prog = budgetProgress[b.id] || { spent: 0, total: 1, label: 'Loading', categoryName: 'Unknown', notes: '' }
                        const pct = Math.min(100, (prog.spent / prog.total) * 100)
                        const isOver = prog.spent > prog.total

                        return (
                            <div key={b.id} onClick={() => { setEditingBudget(b); setShowAddBudget(true) }} style={{
                                background: 'var(--card-bg)', borderRadius: '16px', padding: '15px',
                                display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer'
                            }}>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{prog.categoryName || b.name}</div>
                                <div style={{ fontSize: '10px', color: '#888' }}>{prog.label}</div>

                                {prog.notes && (
                                    <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic', marginBottom: '2px' }}>
                                        "{prog.notes}"
                                    </div>
                                )}

                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: isOver ? '#FF453A' : 'var(--text-primary)' }}>
                                    ${prog.spent.toFixed(0)} <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>/ {prog.total}</span>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ height: '6px', width: '100%', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${pct}%`,
                                        background: isOver ? '#FF453A' : '#32D74B',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* MODALS */}
            {(showAddBill || editingBill) && (
                <InputOverlay
                    title={editingBill ? "Edit Bill" : "Add Bill"}
                    placeholder="Bill Name (e.g. Rent)"
                    initialValue={editingBill?.name || ''}
                    showBillOptions={true}
                    initialBillData={editingBill}
                    onSave={handleSaveBill}
                    onCancel={() => { setShowAddBill(false); setEditingBill(null) }}
                />
            )}

            {(showAddBudget || editingBudget) && (
                <InputOverlay
                    title={editingBudget ? "Edit Budget" : "New Budget"}
                    placeholder="Budget Name"
                    initialValue={editingBudget?.name || ''}
                    showBudgetOptions={true}
                    initialBudgetData={editingBudget}
                    onSave={handleSaveBudget}
                    onCancel={() => { setShowAddBudget(false); setEditingBudget(null) }}
                />
            )}

        </div>
    )
}
