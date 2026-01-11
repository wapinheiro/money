import { useState, useRef, useEffect } from 'react'
import './ActionWheel.css'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

// ... existing imports ...

// ... inside component ...

// Haptics
const vibrate = async () => {
    try {
        await Haptics.impact({ style: ImpactStyle.Light })
    } catch (e) {
        // Fallback for web dev
        if (navigator.vibrate) navigator.vibrate(15)
    }
}
// ... existing imports ...

export default function ActionWheel({ items = [], onInput, onSave, mode = 'numpad', onSpinChange }) {
    // ... (State and handlers remain the same) ...
    // State for Spin Physics
    const [rotation, setRotation] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const lastAngle = useRef(0)
    const velocity = useRef(0)
    const rafId = useRef(null)

    // Haptics
    const vibrate = () => {
        if (navigator.vibrate) navigator.vibrate(5)
    }

    // Calculate angle from center of wheel to touch point
    const getAngle = (clientX, clientY, rect) => {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dx = clientX - centerX
        const dy = clientY - centerY
        return Math.atan2(dy, dx) * (180 / Math.PI)
    }

    // --- TOUCH HANDLERS FOR SPINNER ---
    // --- TOUCH HANDLERS FOR SPINNER ---
    const dragDistance = useRef(0)

    const handleStart = (e) => {
        setIsDragging(true)
        dragDistance.current = 0
        velocity.current = 0
        // Stop any inertial movement
        if (rafId.current) cancelAnimationFrame(rafId.current)

        const touch = e.touches ? e.touches[0] : e
        const rect = e.currentTarget.getBoundingClientRect()
        // Capture initial angle relative to current rotation
        lastAngle.current = getAngle(touch.clientX, touch.clientY, rect) - rotation
    }

    const handleMove = (e) => {
        if (!isDragging) return
        const touch = e.touches ? e.touches[0] : e
        const rect = e.currentTarget.getBoundingClientRect()
        const currentAngle = getAngle(touch.clientX, touch.clientY, rect)

        const newRotation = currentAngle - lastAngle.current

        // Track total movement for click safety
        const delta = Math.abs(newRotation - rotation)
        dragDistance.current += delta

        // Calculate simple instantaneous velocity
        velocity.current = newRotation - rotation
        setRotation(newRotation)

        // Logic to select item based on rotation could go here (triggering haptics)
        // For now, we just spin.
        if (Math.abs(velocity.current) > 1) vibrate()
    }

    const handleEnd = () => {
        setIsDragging(false)
        // Start Inertia loop
        requestAnimationFrame(inertiaLoop)
    }

    // --- PHYSICS LOOP ---
    const inertiaLoop = () => {
        if (Math.abs(velocity.current) < 0.1) return // Stop when slow enough

        // "Water" Friction: Decelerate
        velocity.current *= 0.95

        setRotation(prev => prev + velocity.current)

        if (Math.abs(velocity.current) > 0.5) vibrate() // Tick while spinning fast

        rafId.current = requestAnimationFrame(inertiaLoop)
    }

    // --- CLICK HANDLER ---
    const handleWedgeClick = (item) => {
        // Safety: If we dragged more than a few degrees, treat as spin, not click
        if (Math.abs(dragDistance.current) > 5) return

        // Context Mode: Tap triggers specific action (e.g. edit)
        // Numpad Mode: Tap inputs value
        vibrate()
        onInput(item)
    }

    // Dynamic Geometry
    const itemCount = items.length
    const sliceAngle = 360 / itemCount
    const radius = 160 // Matches CSS
    // Tangent Formula: 2 * R * tan(theta/2)
    // We subtract a small "gap" (e.g. 2px) to let the background show through as a separator line.
    const gap = 2
    const wedgeWidth = (2 * radius * Math.tan((sliceAngle / 2) * (Math.PI / 180))) - gap

    return (
        <div
            className={`wheel-container ${mode}`}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            // Mouse events
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            style={{ transform: `rotate(${rotation}deg)` }}
        >
            {/* RENDER WEDGES */}
            {items.map((item, index) => {
                const angle = index * sliceAngle
                return (
                    <div
                        key={item.label || item.value}
                        className={`wedge ${mode}-wedge`}
                        style={{
                            transform: `rotate(${angle}deg)`,
                            width: `${wedgeWidth}px`,
                            marginLeft: `${-wedgeWidth / 2}px`
                        }}
                    >
                        {/* 1) The Background Shape */}
                        <div className="wedge-shape"></div>

                        {/* 2) The Content */}
                        <div
                            className="wedge-content-touch-target"
                            onClick={() => handleWedgeClick(item)}
                        >
                            {/* GYRO TEXT: Counter-rotate to keep upright */}
                            <div className="wedge-content" style={{ transform: `rotate(${-angle - rotation}deg)` }}>
                                {item.label}
                                {item.subLabel && <div className="wedge-sublabel">{item.subLabel}</div>}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
