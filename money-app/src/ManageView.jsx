import { useState, useEffect } from 'react'
import { db } from './db'
import InputOverlay from './InputOverlay'

export default function ManageView({ type, onBack }) {
    const [items, setItems] = useState([])
    const [isEditing, setIsEditing] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [editId, setEditId] = useState(null)

    const titleMap = {
        'merchant': 'Merchants',
        'category': 'Categories',
        'account': 'Accounts'
    }

    useEffect(() => {
        loadItems()
    }, [type])

    const loadItems = async () => {
        let data = []
        if (type === 'merchant') data = await db.merchants.toArray()
        if (type === 'category') data = await db.categories.toArray()
        if (type === 'account') data = await db.accounts.toArray()
        // Sort by name
        data.sort((a, b) => a.name.localeCompare(b.name))
        setItems(data)
    }

    const handleSave = async () => {
        if (!inputValue.trim()) return

        const table = type === 'merchant' ? db.merchants :
            type === 'category' ? db.categories : db.accounts

        if (editId) {
            await table.update(editId, { name: inputValue })
        } else {
            // Create New
            const newObj = {
                name: inputValue,
                icon: type === 'account' ? '💳' : type === 'merchant' ? '🏪' : '📂',
                color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random Color
            }
            await table.add(newObj)
        }

        setIsEditing(false)
        setInputValue('')
        setEditId(null)
        loadItems()
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this item?")) return
        const table = type === 'merchant' ? db.merchants :
            type === 'category' ? db.categories : db.accounts
        await table.delete(id)
        loadItems()
    }

    const startEdit = (item) => {
        setInputValue(item.name)
        setEditId(item.id)
        setIsEditing(true)
    }

    const startAdd = () => {
        setInputValue('')
        setEditId(null)
        setIsEditing(true)
    }

    return (
        <div className="manage-view" style={{
            width: '100%', height: '100%',
            backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
            display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box'
        }}>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingTop: '40px' }}>
                <button onClick={onBack} style={{
                    background: 'none', border: 'none', fontSize: '24px', marginRight: '15px',
                    cursor: 'pointer', color: 'var(--text-primary)'
                }}>←</button>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{titleMap[type]}</div>
            </div>

            {/* LIST */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
                {items.map(item => (
                    <div key={item.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '15px 0', borderBottom: '1px solid rgba(128,128,128,0.1)'
                    }}>
                        <div onClick={() => startEdit(item)} style={{ flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: (item.color || '#888') + '33', color: item.color || '#888',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                marginRight: '15px', fontSize: '20px'
                            }}>
                                {item.icon || '•'}
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: '500' }}>{item.name}</span>
                        </div>
                        <button onClick={() => handleDelete(item.id)} style={{
                            background: 'none', border: 'none', fontSize: '18px',
                            color: 'var(--text-secondary)', cursor: 'pointer', padding: '10px'
                        }}>🗑️</button>
                    </div>
                ))}
            </div>

            {/* FAB ADD */}
            <button onClick={startAdd} style={{
                position: 'absolute', bottom: '40px', right: '30px',
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'var(--accent-color)', color: 'white',
                border: 'none', fontSize: '32px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>+</button>

            {/* INPUT OVERLAY */}
            {isEditing && (
                <InputOverlay
                    title={editId ? 'Edit Item' : 'New Item'}
                    placeholder="Type a name..."
                    initialValue={inputValue}
                    onSave={(val) => {
                        setInputValue(val)
                        // Trigger save logic which uses `inputValue`, 
                        // but `handleSave` uses state. We need to adapt it slightly 
                        // or just update state and call handleSave.
                        // Better to refactor handleSave to accept an arg.
                        handleSave(val)
                    }}
                    onCancel={() => {
                        setIsEditing(false)
                        setInputValue('')
                    }}
                />
            )}
        </div>
    )
}
