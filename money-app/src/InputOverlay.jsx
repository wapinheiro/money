import React, { useState, useEffect, useRef } from 'react'
import { db } from './db'

export default function InputOverlay({
    title, placeholder, initialValue = '',
    onSave, onCancel,
    showTagOptions = false, initialTagData,
    showBillOptions = false, initialBillData,
    showBudgetOptions = false, initialBudgetData
}) {
    const [value, setValue] = useState(initialValue)

    // Tag Specific State
    const [isTemp, setIsTemp] = useState(initialTagData?.type === 'temporary' || false)
    const [startDate, setStartDate] = useState(initialTagData?.startDate || new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(initialTagData?.endDate || '')

    // Bill Specific State
    const [billAmount, setBillAmount] = useState(initialBillData?.amount || '')
    const [billDay, setBillDay] = useState(initialBillData?.recurrenceDay || 1) // Day 1-31
    const [isAutoPay, setIsAutoPay] = useState(initialBillData?.isAutoPay || false)
    const [autoPayAccountId, setAutoPayAccountId] = useState(initialBillData?.autoPayAccountId || '')
    const [accounts, setAccounts] = useState([])

    // Budget Specific State
    const [budgetLimit, setBudgetLimit] = useState(initialBudgetData?.limit || '')
    const [budgetPeriod, setBudgetPeriod] = useState(initialBudgetData?.period || 'monthly')
    const [budgetCustomStart, setBudgetCustomStart] = useState(initialBudgetData?.startDate || new Date().toISOString().split('T')[0])
    const [budgetCustomEnd, setBudgetCustomEnd] = useState(initialBudgetData?.endDate || '')
    const [budgetCategoryId, setBudgetCategoryId] = useState(initialBudgetData?.scopeId || '') // Used for Tag ID too if type is tag
    const [budgetType, setBudgetType] = useState(initialBudgetData?.type || 'category')
    const [budgetNotes, setBudgetNotes] = useState(initialBudgetData?.notes || '')
    const [budgetRollover, setBudgetRollover] = useState(initialBudgetData?.isRollover || false)
    const [categories, setCategories] = useState([])
    const [tags, setTags] = useState([])

    // Category Creation State
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryParent, setNewCategoryParent] = useState('')

    const inputRef = useRef(null)

    useEffect(() => {
        setValue(initialValue)
        if (initialTagData?.type) setIsTemp(initialTagData.type === 'temporary')
        if (initialTagData?.startDate) setStartDate(initialTagData.startDate)
        if (initialTagData?.endDate) setEndDate(initialTagData.endDate)

        if (initialBillData?.amount) setBillAmount(initialBillData.amount)
        if (initialBillData?.amount) setBillAmount(initialBillData.amount)
        if (initialBillData?.recurrenceDay) setBillDay(initialBillData.recurrenceDay)
        if (initialBillData?.isAutoPay) setIsAutoPay(initialBillData.isAutoPay)
        if (initialBillData?.autoPayAccountId) setAutoPayAccountId(initialBillData.autoPayAccountId)

        // Load Accounts
        if (showBillOptions) {
            db.accounts.toArray().then(setAccounts)
        }
        if (showBudgetOptions) {
            db.categories.toArray().then(setCategories)
            db.tags.toArray().then(setTags)
        }

        // Auto-focus with slight delay for animation
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus()
        }, 100)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValue]) // Only reset if initialValue changes (primitive). Ignore stable object changes to avoid loops.

    const handleSubmit = () => {
        if (!showBudgetOptions && !value.trim()) return

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
                recurrence: 'monthly',
                status: 'unpaid',
                isAutoPay: isAutoPay,
                autoPayAccountId: isAutoPay ? autoPayAccountId : null
            })
        } else if (showBudgetOptions) {
            // Derived Name from Category if not manually set (though manual input is hidden now)
            let derivedName = value
            if (!derivedName && budgetCategoryId) {
                if (budgetType === 'tag') {
                    const tag = tags.find(t => t.id == budgetCategoryId)
                    if (tag) derivedName = tag.name
                } else {
                    const cat = categories.find(c => c.id == budgetCategoryId)
                    if (cat) derivedName = cat.name
                }
            }

            onSave({
                name: derivedName,
                limit: parseFloat(budgetLimit || '0'),
                period: budgetPeriod,
                scopeId: budgetCategoryId ? parseInt(budgetCategoryId) : null, // ID
                type: budgetType,
                startDate: budgetPeriod === 'custom' ? budgetCustomStart : null,
                endDate: budgetPeriod === 'custom' ? budgetCustomEnd : null,
                notes: budgetNotes,
                isRollover: budgetRollover,
                rolloverStartDate: budgetRollover && !initialBudgetData?.rolloverStartDate ? new Date().toISOString().split('T')[0] : (initialBudgetData?.rolloverStartDate || null)
            })
        } else {
            onSave(value)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit()
    }

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) return

        // Create Category
        // Icon logic: inherit from parent or random/default?
        // Let's assume generic icon or deduce from name later.
        const parent = categories.find(c => c.id == newCategoryParent)
        const icon = parent ? parent.icon : '🏷️'

        const newId = await db.categories.add({
            name: newCategoryName,
            icon: icon,
            color: '#888',
            parentId: newCategoryParent ? parseInt(newCategoryParent) : null
        })

        // Reload Categories
        const updatedCats = await db.categories.toArray()
        setCategories(updatedCats)

        // Select logic
        setBudgetCategoryId(newId)

        // Reset
        setIsCreatingCategory(false)
        setNewCategoryName('')
        setNewCategoryParent('')
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
                    {isCreatingCategory ? "New Category" : title}
                </div>

                {isCreatingCategory ? (
                    // CATEGORY CREATION MODE
                    <div>
                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Category Name</label>
                        <input
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Gas"
                            style={{
                                width: '100%', padding: '15px', borderRadius: '12px',
                                border: '1px solid rgba(128,128,128,0.2)',
                                background: 'var(--bg-app)', color: 'var(--text-primary)',
                                fontSize: '18px', marginBottom: '20px', boxSizing: 'border-box',
                                outline: 'none'
                            }}
                        />

                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Parent Category (Optional)</label>
                        <select
                            value={newCategoryParent}
                            onChange={e => setNewCategoryParent(e.target.value)}
                            style={{
                                width: '100%', padding: '10px', borderRadius: '8px',
                                marginBottom: '20px',
                                border: '1px solid rgba(128,128,128,0.3)',
                                background: 'var(--bg-app)', color: 'var(--text-primary)',
                                fontSize: '16px'
                            }}
                        >
                            <option value="">No Parent (Top Level)</option>
                            {/* Only show Top Level Categories as parents to avoid deep nesting complexity for now */}
                            {categories.filter(c => !c.parentId).map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setIsCreatingCategory(false)} style={{
                                flex: 1, padding: '15px', borderRadius: '12px',
                                background: 'transparent', border: '1px solid rgba(128,128,128,0.3)',
                                color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer'
                            }}>Cancel</button>
                            <button onClick={handleSaveCategory} style={{
                                flex: 1, padding: '15px', borderRadius: '12px',
                                background: 'var(--accent-color)', border: 'none',
                                color: 'white', fontWeight: 'bold', cursor: 'pointer'
                            }}>Create Category</button>
                        </div>
                    </div>
                ) : (
                    // STANDARD MODE
                    <>
                        {/* TITLE INPUT (Hidden for Budgets) */}
                        {!showBudgetOptions && (
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
                        )}

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


                                {/* AUTO PAY TOGGLE */}
                                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={isAutoPay}
                                        onChange={e => setIsAutoPay(e.target.checked)}
                                        style={{ width: '20px', height: '20px', marginRight: '10px' }}
                                    />
                                    <span style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Automatic Payment?</span>
                                </div>

                                {/* ACCOUNT SELECTOR (If AutoPay) */}
                                {isAutoPay && (
                                    <div style={{ marginTop: '15px' }}>
                                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Payment Account</label>
                                        <select
                                            value={autoPayAccountId}
                                            onChange={e => setAutoPayAccountId(parseInt(e.target.value))}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: '8px',
                                                border: '1px solid rgba(128,128,128,0.3)',
                                                background: 'var(--bg-app)', color: 'var(--text-primary)',
                                                fontSize: '16px'
                                            }}
                                        >
                                            <option value="">Select Account...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {showBudgetOptions && (
                            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>

                                {/* CATEGORY SELECTOR */}
                                {/* BUDGET TYPE TOGGLE */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Budget For</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => { setBudgetType('category'); setBudgetCategoryId('') }}
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: '8px',
                                                border: `1px solid ${budgetType === 'category' ? 'var(--accent-color)' : '#444'}`,
                                                background: budgetType === 'category' ? 'var(--accent-color)' : 'transparent',
                                                color: 'white', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >Category</button>
                                        <button
                                            onClick={() => { setBudgetType('tag'); setBudgetCategoryId('') }}
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: '8px',
                                                border: `1px solid ${budgetType === 'tag' ? 'var(--accent-color)' : '#444'}`,
                                                background: budgetType === 'tag' ? 'var(--accent-color)' : 'transparent',
                                                color: 'white', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >Tag</button>
                                    </div>
                                </div>

                                {/* CATEGORY SELECTOR */}
                                {budgetType === 'category' && (
                                    <>
                                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Category</label>
                                        <select
                                            value={budgetCategoryId}
                                            onChange={e => setBudgetCategoryId(e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: '8px',
                                                marginBottom: '15px',
                                                border: '1px solid rgba(128,128,128,0.3)',
                                                background: 'var(--bg-app)', color: 'var(--text-primary)',
                                                fontSize: '16px'
                                            }}
                                        >
                                            <option value="">Select Category...</option>
                                            {categories.filter(c => !c.parentId).map(parent => (
                                                <React.Fragment key={parent.id}>
                                                    <option value={parent.id}>{parent.icon} {parent.name}</option>
                                                    {categories.filter(child => child.parentId === parent.id).map(child => (
                                                        <option key={child.id} value={child.id}>&nbsp;&nbsp;&nbsp;↳ {child.icon} {child.name}</option>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </select>
                                        <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 15 }}>
                                            <span
                                                onClick={() => setIsCreatingCategory(true)}
                                                style={{ fontSize: '12px', color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                + Create New Category
                                            </span>
                                        </div>
                                    </>
                                )}

                                {/* TAG SELECTOR */}
                                {budgetType === 'tag' && (
                                    <>
                                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Select Tag</label>
                                        <select
                                            value={budgetCategoryId}
                                            onChange={e => setBudgetCategoryId(e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: '8px',
                                                marginBottom: '15px',
                                                border: '1px solid rgba(128,128,128,0.3)',
                                                background: 'var(--bg-app)', color: 'var(--text-primary)',
                                                fontSize: '16px'
                                            }}
                                        >
                                            <option value="">Select Tag...</option>
                                            {tags.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                {/* LIMIT INPUT */}
                                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Limit Amount</label>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '20px', marginRight: '10px', color: '#888' }}>$</span>
                                    <input
                                        type="number"
                                        value={budgetLimit}
                                        onChange={e => setBudgetLimit(e.target.value)}
                                        placeholder="0.00"
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px',
                                            border: '1px solid rgba(128,128,128,0.3)',
                                            background: 'var(--bg-app)', color: 'var(--text-primary)',
                                            fontSize: '18px'
                                        }}
                                    />
                                </div>

                                {/* PERIOD SELECTOR */}
                                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Budget Period</label>
                                <select
                                    value={budgetPeriod}
                                    onChange={e => setBudgetPeriod(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '8px',
                                        marginBottom: '10px',
                                        border: '1px solid rgba(128,128,128,0.3)',
                                        background: 'var(--bg-app)', color: 'var(--text-primary)',
                                        fontSize: '16px'
                                    }}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="custom">Custom Range</option>
                                </select>

                                {/* CUSTOM DATES */}
                                {budgetPeriod === 'custom' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '10px', color: '#888' }}>Start</label>
                                            <input type="date" value={budgetCustomStart} onChange={e => setBudgetCustomStart(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#333', border: 'none', color: 'white' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '10px', color: '#888' }}>End</label>
                                            <input type="date" value={budgetCustomEnd} onChange={e => setBudgetCustomEnd(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#333', border: 'none', color: 'white' }} />
                                        </div>
                                    </div>
                                )}

                                {/* COMMENTS / NOTES */}
                                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Comments / Details</label>
                                <textarea
                                    value={budgetNotes}
                                    onChange={e => setBudgetNotes(e.target.value)}
                                    placeholder="Add details about this budget (e.g. Parking, Gas, etc.)"
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '8px',
                                        marginBottom: '15px',
                                        border: '1px solid rgba(128,128,128,0.3)',
                                        background: 'var(--bg-app)', color: 'var(--text-primary)',
                                        fontSize: '14px', height: '60px', resize: 'none', fontFamily: 'inherit'
                                    }}
                                />

                                {/* ROLLOVER TOGGLE */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={budgetRollover}
                                        onChange={e => setBudgetRollover(e.target.checked)}
                                        style={{ width: '20px', height: '20px', marginRight: '10px', marginTop: '2px' }}
                                    />
                                    <div>
                                        <span style={{ fontSize: '16px', display: 'block' }}>Rollover Unused Funds?</span>
                                        <span style={{ fontSize: '12px', color: '#888' }}>
                                            If checked, unspent budget from previous periods will accumulate to this one.
                                        </span>
                                    </div>
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
                    </>
                )}
            </div>
        </div >
    )
}
