# Plan to animate ONLY the sidebar

User wants:
When clicking 'settings', the original sidebar (POSLayout) slides out, and the settings sidebar (POSShopSettings) slides in.
The right content area changes to the settings content (white/glass).

Currently, POSLayout completely replaces the DOM structure when `activeView === 'settings'`.

Solution:
Instead of swapping the entire layout in `POSLayout.tsx`, let's keep the POSLayout standard structure, but conditionally render the sidebar and header!

Wait, POSShopSettings is huge. It has its own sidebar and right pane.
If we keep POSLayout's standard structure:
```tsx
<div className="flex h-screen">
   {/* Sidebar Area */}
   <aside className="w-[300px]">
       <AnimatePresence mode="wait">
           {activeView === 'settings' ? (
               <motion.div key="settings-sidebar">
                   {/* We need POSShopSettings Sidebar here! */}
               </motion.div>
           ) : (
               <motion.div key="main-sidebar">
                   {renderSidebarContent()}
               </motion.div>
           )}
       </AnimatePresence>
   </aside>

   {/* Main Content Area */}
   <div className="flex-1">
       {activeView === 'settings' ? (
           <motion.div key="settings-content">
               {/* We need POSShopSettings Content here! */}
           </motion.div>
       ) : (
           <motion.div key="main-content">
               <header>...</header>
               <main>{children}</main>
           </motion.div>
       )}
   </div>
</div>
```

To do this, we need to extract the sidebar from `POSShopSettings.tsx`?
No! `POSShopSettings` relies heavily on `activeTab` state which is defined inside `POSShopSettings.tsx`. If we move its sidebar to `POSLayout`, we have to lift `activeTab` up. That's a huge refactor.
