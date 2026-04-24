"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

/**
 * Custom Switch component using Base UI primitives.
 * Uses inline styles for pixel-perfect thumb positioning.
 * 
 * Base UI data attributes:
 *   Root  → data-checked / data-unchecked
 *   Thumb → data-checked / data-unchecked
 */
const Switch = React.forwardRef<
  HTMLButtonElement,
  SwitchPrimitive.Root.Props & { className?: string }
>(({ className, ...props }, ref) => {
  // Use state to read Base UI's checked value for styling
  const [internalChecked, setInternalChecked] = React.useState(
    props.checked ?? props.defaultChecked ?? false
  )

  // Sync with controlled prop
  React.useEffect(() => {
    if (props.checked !== undefined) {
      setInternalChecked(props.checked)
    }
  }, [props.checked])

  const handleCheckedChange: SwitchPrimitive.Root.Props['onCheckedChange'] = (checked, details) => {
    setInternalChecked(checked)
    props.onCheckedChange?.(checked, details)
  }

  const isOn = internalChecked

  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      {...props}
      onCheckedChange={handleCheckedChange}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 44,
        height: 24,
        borderRadius: 9999,
        padding: 2,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        backgroundColor: isOn ? '#10b981' : '#cbd5e1',
        transition: 'background-color 200ms ease',
        outline: 'none',
        border: 'none',
        flexShrink: 0,
        ...(typeof props.style === 'object' ? props.style : {}),
      }}
      className={className}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        style={{
          display: 'block',
          width: 20,
          height: 20,
          borderRadius: 9999,
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'transform 200ms ease',
          transform: isOn ? 'translateX(20px)' : 'translateX(0px)',
          pointerEvents: 'none',
        }}
      />
    </SwitchPrimitive.Root>
  )
})

Switch.displayName = "Switch"

export { Switch }
