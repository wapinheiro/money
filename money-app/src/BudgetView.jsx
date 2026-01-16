import React, { useState, useEffect } from 'react'
import { db } from './db'
import InputOverlay from './InputOverlay'

export default function BudgetView({ onBack }) {
    const [bills, setBills] = useState([])
    const [budgets, setBudgets] = useState([])

    // Toggles for UI keying
    const [viewMode, setViewMode] = useState('planning') // 'planning' | 'management'
    const [showAddBill, setShowAddBill] = useState(false)
    const [editingBill, setEditingBill] = useState(null) // New State for Editing

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

            {editingBill && (
                <InputOverlay
                    title="Edit Bill"
                    placeholder="Bill Name"
                    initialValue={editingBill.name}
                    showBillOptions={true}
                    initialBillData={{
                        amount: editingBill.amount,
                        dueDate: editingBill.dueDate,
                        recurrenceDay: editingBill.recurrenceDay, // Pass Day of Month
                        isAutoPay: editingBill.isAutoPay,
                        autoPayAccountId: editingBill.autoPayAccountId
                    }}
                    onSave={handleSaveBill}
                    onCancel={() => setEditingBill(null)}
                />
            )}

        </div>
    )
}
