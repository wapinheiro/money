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
const NUMPAD_ITEMS = [
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '⌫', value: 'del' },
]

// ... (Rest of code remains similar, but wedge drawing needs update)

// ...

export default function ActionWheel({ onInput, onSave, mode = 'numpad', onSpinChange }) {
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

    // --- CLICK HANDLER FOR NUMPAD ---
    const handleWedgeClick = (item) => {
        // Safety: If we dragged more than a few degrees, treat as spin, not click
        if (Math.abs(dragDistance.current) > 5) return

        if (mode === 'spinner') return // Generic spinner doesn't input values yet

        vibrate()
        onInput(item.value)
    }

    return (
        <div
            className={`wheel-container ${mode}`}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            // Mouse events for testing on desktop
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            style={{ transform: `rotate(${rotation}deg)` }}
        >
            {/* RENDER WEDGES */}
            {NUMPAD_ITEMS.map((item, index) => {
                // 11 items = 32.7deg per slice
                const angle = index * (360 / 11)
                return (
                    <div
                        key={item.label}
                        className="wedge"
                        style={{ transform: `rotate(${angle}deg)` }}
                    >
                        {/* 1) The Yellow Cone (Background Shape) */}
                        <div className="wedge-shape"></div>

                        {/* 2) The Text (Content) */}
                        <div
                            className="wedge-content-touch-target"
                            onClick={() => handleWedgeClick(item)}
                        >
                            {/* GYRO TEXT: Rotate Negative (Angle + ContainerRotation) to keep upright */}
                            <div className="wedge-content" style={{ transform: `rotate(${-angle - rotation}deg)` }}>
                                {item.label}
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* CENTER BUTTON (Static overlay, does not spin with container in CSS usually, but here simplicity) */}
            {/* We actually need the Center Button OUTSIDE the spinning container if the container spins */}
        </div>
    )
}
