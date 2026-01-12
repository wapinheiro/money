import { useState, useRef, useEffect } from 'react'
import './ActionWheel.css'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

// Haptics Helper
const vibrate = async () => {
    try {
        await Haptics.impact({ style: ImpactStyle.Light })
    } catch (e) {
        if (navigator.vibrate) navigator.vibrate(15)
    }
}

export default function ActionWheel({ items = [], onInput, mode = 'numpad', onSpinChange }) {
    const containerRef = useRef(null)

    // PHYSICS STATE (Refs for Native Listener Access)
    const rotationRef = useRef(0)
    const lastAngleRef = useRef(0)
    const velocityRef = useRef(0)
    const isDraggingRef = useRef(false)
    const rafIdRef = useRef(null)
    const dragDistanceRef = useRef(0)
    const tickAccumulatorRef = useRef(0)

    // REACT STATE (For Rendering)
    const [renderRotation, setRenderRotation] = useState(0)

    // CONSTANTS
    const TICK_THRESHOLD = 45

    // Helper: Get Angle
    const getAngle = (clientX, clientY, rect) => {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dx = clientX - centerX
        const dy = clientY - centerY
        return Math.atan2(dy, dx) * (180 / Math.PI)
    }

    // --- LISTENER LOGIC ---
    const onTouchStart = (e) => {
        // e.preventDefault() // Optional here
        isDraggingRef.current = true
        dragDistanceRef.current = 0
        velocityRef.current = 0
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)

        const touch = e.touches ? e.touches[0] : e
        const rect = containerRef.current.getBoundingClientRect()

        // Calculate offset
        lastAngleRef.current = getAngle(touch.clientX, touch.clientY, rect) - rotationRef.current
        tickAccumulatorRef.current = 0
    }

    const onTouchMove = (e) => {
        // CRITICAL: Prevent Browser Scroll
        if (e.cancelable) e.preventDefault()

        if (!isDraggingRef.current) return

        const touch = e.touches ? e.touches[0] : e
        const rect = containerRef.current.getBoundingClientRect()
        const currentAngle = getAngle(touch.clientX, touch.clientY, rect)

        const newRotation = currentAngle - lastAngleRef.current

        // Metrics
        const diff = newRotation - rotationRef.current
        dragDistanceRef.current += Math.abs(diff)
        velocityRef.current = diff

        // Update State
        rotationRef.current = newRotation
        setRenderRotation(newRotation) // Trigger Render

        // Tick Logic
        if (mode === 'edit' && onSpinChange) {
            tickAccumulatorRef.current += diff
            if (Math.abs(tickAccumulatorRef.current) >= TICK_THRESHOLD) {
                const dir = tickAccumulatorRef.current > 0 ? 1 : -1
                onSpinChange(dir)
                vibrate()
                tickAccumulatorRef.current -= (dir * TICK_THRESHOLD)
            }
        } else {
            if (Math.abs(velocityRef.current) > 1) vibrate()
        }
    }

    const onTouchEnd = (e) => {
        isDraggingRef.current = false
        requestAnimationFrame(inertiaLoop)
    }

    const inertiaLoop = () => {
        if (isDraggingRef.current) return
        if (Math.abs(velocityRef.current) < 0.1) return

        velocityRef.current *= 0.95
        rotationRef.current += velocityRef.current
        setRenderRotation(rotationRef.current)

        // Tick Logic (Inertia)
        if (mode === 'edit' && onSpinChange) {
            tickAccumulatorRef.current += velocityRef.current
            if (Math.abs(tickAccumulatorRef.current) >= TICK_THRESHOLD) {
                const dir = tickAccumulatorRef.current > 0 ? 1 : -1
                onSpinChange(dir)
                vibrate()
                tickAccumulatorRef.current -= (dir * TICK_THRESHOLD)
            }
        } else {
            if (Math.abs(velocityRef.current) > 0.5) vibrate()
        }

        rafIdRef.current = requestAnimationFrame(inertiaLoop)
    }

    // --- EFFECCT: BIND LISTENERS ---
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const opts = { passive: false }

        // Touch
        el.addEventListener('touchstart', onTouchStart, opts)
        el.addEventListener('touchmove', onTouchMove, opts) // The Magic Line
        el.addEventListener('touchend', onTouchEnd, opts)

        // Mouse (For Dev)
        const onMouseDown = (e) => onTouchStart(e)
        const onMouseMove = (e) => {
            if (isDraggingRef.current) onTouchMove(e)
        }
        const onMouseUp = (e) => onTouchEnd(e)

        el.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)

        return () => {
            el.removeEventListener('touchstart', onTouchStart)
            el.removeEventListener('touchmove', onTouchMove)
            el.removeEventListener('touchend', onTouchEnd)
            el.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [mode]) // Re-bind only if mode changes (for Tick Logic closure)
    // NOTE: onSpinChange must be stable or ref'd to strictly avoid stale closures, 
    // but typically Function props are stable enough or we accept hot-swap re-bind.

    // Calculate Geometry
    const itemCount = items.length
    const radius = 160
    const gap = 2
    const wedgeWidth = (2 * radius * Math.tan(((360 / items.length) / 2) * (Math.PI / 180))) - gap

    return (
        <div
            ref={containerRef}
            className={`wheel-container ${mode}`}
            style={{ transform: `rotate(${renderRotation}deg)` }}
        >
            {mode === 'edit' ? (
                <div className="solid-disk-overlay"></div>
            ) : (
                items.map((item, index) => {
                    const angle = index * (360 / itemCount)
                    return (
                        <div
                            key={index}
                            className={`wedge ${mode}-wedge`}
                            style={{
                                transform: `rotate(${angle}deg)`,
                                width: `${wedgeWidth}px`,
                                marginLeft: `${-wedgeWidth / 2}px`
                            }}
                        >
                            <div className="wedge-shape"></div>
                            <div
                                className="wedge-content-touch-target"
                                onClick={() => {
                                    if (Math.abs(dragDistanceRef.current) < 5) {
                                        vibrate()
                                        onInput(item)
                                    }
                                }}
                            >
                                <div className="wedge-content" style={{ transform: `rotate(${-angle - renderRotation}deg)` }}>
                                    {item.label}
                                    {item.subLabel && <div className="wedge-sublabel">{item.subLabel}</div>}
                                </div>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    )
}
