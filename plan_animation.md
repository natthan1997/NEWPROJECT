# Plan for Seamless Sidebar Swap Animation

1. **POSLayout.tsx**
   - Remove `mode="wait"` from `<AnimatePresence>`.
   - `settings-view` root `motion.div`: Remove all `initial`, `animate`, `exit` props. Just keep it as a `motion.div`.
   - `main-view` root `motion.div`: Remove all `initial`, `animate`, `exit` props.
   - `main-view`'s `<aside>` (Persistent Sidebar): Change to `<motion.aside>`. Add `initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}`.
   - `main-view`'s `<div className="flex-1 ...">` (Main Content): Change to `<motion.div>`. Add `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}`.

2. **POSShopSettings.tsx**
   - Import `motion` from `framer-motion`.
   - Sidebar (`<div className="w-full md:w-[300px]...">`): Change to `<motion.div>`. Add `initial={{ x: -380 }} animate={{ x: 0 }} exit={{ x: -380 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}`.
   - Main Content (`<div className="flex-1 ...">`): Change to `<motion.div>`. Add `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.1 }}`.

By animating the children, and letting them overlap (no `mode="wait"`), the original sidebar will slide out to the left AT THE SAME TIME the new sidebar slides in from the left. And the content area will crossfade.
