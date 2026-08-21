# Project Rules & Customizations

## POS Layout Transitions Rule

When designing page transitions or tab switching in POS Terminal:
1. **Always-Mounted Siblings Pattern**: Do not conditionally unmount panels (e.g., using ternary operators like `activeTab === 'A' ? <A /> : <B />`) if they contain large DOM trees or are part of layout animation. Instead, render them as siblings simultaneously in the DOM, toggling their visibility via opacity and position transitions. This prevents browser reflow/repaint stutter.
2. **Zero CSS Transitions Conflict**: Never apply CSS transition classes (like Tailwind's `transition-all`, `duration-300`, etc.) to elements that are animated by Framer Motion (including children of layout-transitioned columns). This prevents browser transitions from intercepting Framer Motion's manual layout transform calculations.
3. **Coordinated Framer Motion Animations**: Use `motion.div` on the siblings. Animate their position and opacity directly in Framer Motion. Coordinate sibling animations and parent column layout changes using identical cubic-bezier transitions:
   - Easing: `ease: [0.16, 1, 0.3, 1]` (custom cubic-bezier)
   - Duration: `0.35` seconds
4. **Immediate Target Content Swap**: When returning or clicking "back" from a sub-view (like tables manager to catalog), switch the rendered content state (e.g., `renderedLandscapeTab`) immediately at the beginning of the action. This ensures the target screen (the POS catalog/cart itself) is already visible and sliding back into its home position, creating a much more cohesive user experience.

## PIN Modal UI Rule

When implementing PIN verification or cancellation modals in the POS Terminal:
- **Smaller Panel Priority**: Always render the PIN input modal on the side/panel that has less space (e.g., the right-side window in the POS drawer or the right-side window in the POS terminal), rather than overlaying the main content area, to keep the UI clean and compartmentalized.

## Number Formatting Rule

Whenever displaying currency, prices, or large numeric values (e.g., 2000), always format them with thousands separators (commas) using `.toLocaleString()` or equivalent methods so they appear as "2,000" instead of "2000". This applies to all input fields and display text across the application.

## Quantity Selector UI Rule

Whenever implementing a quantity selector (increment/decrement), ALWAYS use this exact specific clean design pattern without outer borders or background containers:
1. **Container**: `flex items-center justify-between w-[120px] shrink-0` (no background, no border).
2. **Minus/Plus Buttons**: Independent circular buttons with a very light background. Classes: `w-12 h-12 rounded-full bg-[#F9F9F9] text-gray-400 hover:text-black hover:bg-gray-100 active:scale-95 flex items-center justify-center transition-all`.
3. **Icons**: Use Lucide `Minus` and `Plus` with `size={16}` and `strokeWidth={3}`.
4. **Number**: Bold, large text in the center without background. Classes: `flex-1 text-center font-black text-[22px] text-[#1A1A18] tracking-tight`.

## Back Button UI Rule

Whenever implementing a back button (to return to a previous screen or close a panel), ALWAYS use this exact specific design pattern:
1. **Container/Button**: `className="text-[#D3202B] hover:text-red-700 transition-colors p-1 -ml-1 border-none bg-transparent active:scale-95 shrink-0"`
2. **Icon**: Use Lucide `ChevronLeft` with `size={24}` and `strokeWidth={3}`.
3. **Usage Example**:
```tsx
<button onClick={...} className="text-[#D3202B] hover:text-red-700 transition-colors p-1 -ml-1 border-none bg-transparent active:scale-95 shrink-0 mr-2">
  <ChevronLeft size={24} strokeWidth={3} />
</button>
```

## Two-Window Layout UI Rule

When designing new pages or screens, always prioritize a 2-window left/right layout:
1. **Dynamic Resizing**: The two windows (main content area and side panel/modal) should flex, stretch, and shrink according to the content.
2. **Visual Separation**: One side should act as the primary background/content area, while the other side acts as a floating panel or sleek modal layered on top or alongside it.
3. **Usage**: Use this pattern for all new layouts to maintain a consistent, premium, and unified POS interface.

## Unified POS Two-Window Layout Rule

To ensure consistency across the entire POS application (including Sales, Tables, Settings, Staff, etc.), all new main screens MUST strictly follow the exact sizing, spacing, and styling of the primary POS sales layout (`POSTerminalLandscape.tsx`). 

1. **Left/Right Roles**: 
   - **Main Content Area**: The primary background area MUST use `bg-transparent` so it seamlessly blends into the global POS background. It must take up all remaining flexible space (`flex-1`).
   - **Floating Sidebar Panel**: Acts as the secondary navigation or context window (like the Cart in the Sales page).

2. **Floating Panel Exact Styling**:
   - Size: `w-full md:w-[380px] xl:w-[450px]` (This perfectly matches the POS Cart width).
   - Glassmorphism & Shadow: `bg-white/95 backdrop-blur-xl md:border border-black/5 md:shadow-[0_20px_40px_rgba(0,0,0,0.08)]`
   - Spacing & Rounded Corners: `shrink-0 md:rounded-[2rem] h-full` (Do not add margins like `my-6 ml-6` because the root POS layout already has `p-4` padding).
   - Animation: Use `motion.div` with `transition={{ type: "spring", stiffness: 300, damping: 30 }}`

3. **No Wrapper Frames**:
   - Do NOT wrap these layouts inside a white container (`bg-white`) with its own border/shadow. The container should be `bg-transparent`. This ensures the floating panel looks like it's floating directly above the app's root background, rather than nested in another box.
