# Project Rules & Customizations

## POS Layout Transitions Rule

When designing page transitions or tab switching in POS Terminal:
1. **Always-Mounted Siblings Pattern**: Do not conditionally unmount panels (e.g., using ternary operators like `activeTab === 'A' ? <A /> : <B />`) if they contain large DOM trees or are part of layout animation. Instead, render them as siblings simultaneously in the DOM, toggling their visibility via opacity and position transitions. This prevents browser reflow/repaint stutter.
2. **Zero CSS Transitions Conflict**: Never apply CSS transition classes (like Tailwind's `transition-all`, `duration-300`, etc.) to elements that are animated by Framer Motion (including children of layout-transitioned columns). This prevents browser transitions from intercepting Framer Motion's manual layout transform calculations.
3. **Coordinated Framer Motion Animations**: Use `motion.div` on the siblings. Animate their position and opacity directly in Framer Motion. Coordinate sibling animations and parent column layout changes using identical cubic-bezier transitions:
   - Easing: `ease: [0.16, 1, 0.3, 1]` (custom cubic-bezier)
   - Duration: `0.35` seconds
4. **Immediate Target Content Swap**: When returning or clicking "back" from a sub-view (like tables manager to catalog), switch the rendered content state (e.g., `renderedLandscapeTab`) immediately at the beginning of the action. This ensures the target screen (the POS catalog/cart itself) is already visible and sliding back into its home position, creating a much more cohesive user experience.
