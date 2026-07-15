'use client';

import React from 'react';
import { X, FlaskConical, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';
import { getPrimaryMenuName, getSecondaryMenuName } from '@/lib/posMenuLabels';

interface RecipeIngredient {
  ingredient_id: string;
  name: string;
  quantity: number | string;
  base_unit?: string;
  recipe_unit?: string;
  factor?: number;
  order_types?: string[];
}

interface POSRecipeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
  orderType?: 'dine_in' | 'takeaway' | 'delivery';
}

export default function POSRecipeViewModal({
  isOpen,
  onClose,
  item,
  orderType = 'dine_in',
}: POSRecipeViewModalProps) {
  const { locale } = useI18n();

  if (!isOpen || !item) return null;

  // Language mapping
  const t = {
    th: {
      title: 'สูตรการเตรียมอาหาร',
      subtitle: 'Recipe & Preparation Guide',
      mainRecipe: 'สูตรหลัก / Main Recipe',
      modifierRecipe: 'ตัวเลือกเสริม / Custom Option',
      noRecipe: 'ไม่มีข้อมูลสูตรอาหารสำหรับเมนูนี้',
      orderTypeLabel: 'ประเภทออเดอร์',
      notUsed: 'ข้าม',
      dine_in: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
    },
    en: {
      title: 'Recipe Guide',
      subtitle: 'Recipe & Preparation Guide',
      mainRecipe: 'Main Recipe',
      modifierRecipe: 'Custom Option',
      noRecipe: 'No recipe data',
      orderTypeLabel: 'Order Type',
      notUsed: 'Skip',
      dine_in: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
    },
    zh: {
      title: '配方制作指南',
      subtitle: 'Recipe & Preparation Guide',
      mainRecipe: '主配方',
      modifierRecipe: '定制选项',
      noRecipe: '无配方数据',
      orderTypeLabel: '订单类型',
      notUsed: '跳过',
      dine_in: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
    },
  }[locale === 'zh' ? 'zh' : locale === 'en' ? 'en' : 'th'] || {
    title: 'สูตรการเตรียมอาหาร',
    subtitle: 'Recipe & Preparation Guide',
    mainRecipe: 'สูตรหลัก / Main Recipe',
    modifierRecipe: 'ตัวเลือกเสริม / Custom Option',
    noRecipe: 'ไม่มีข้อมูลสูตรอาหารสำหรับเมนูนี้',
    orderTypeLabel: 'ประเภทออเดอร์',
    notUsed: 'ข้าม',
    dine_in: 'Dine In',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
  };

  const getOrderTypeLabel = (type: string) => {
    if (type === 'dine_in') return t.dine_in;
    if (type === 'takeaway') return t.takeaway;
    if (type === 'delivery') return t.delivery;
    return type;
  };

  const mainRecipeData: RecipeIngredient[] = item.recipe_data || [];

  // Parse modifier recipes
  const modifierRecipes = (item.selected_modifiers || [])
    .filter((mod: any) => mod.recipe_data && Array.isArray(mod.recipe_data) && mod.recipe_data.length > 0)
    .map((mod: any) => ({
      name: mod.name,
      recipe_data: mod.recipe_data as RecipeIngredient[],
      qty: mod.qty || 1,
    }));

  const hasMainRecipe = mainRecipeData.length > 0;
  const hasModifierRecipes = modifierRecipes.length > 0;
  const hasAnyRecipe = hasMainRecipe || hasModifierRecipes;

  const isIngActive = (ing: RecipeIngredient) => {
    if (!ing.order_types || ing.order_types.length === 0 || ing.order_types.includes('all')) return true;
    if (ing.order_types.includes('none')) return false;
    return ing.order_types.includes(orderType);
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Soft dark overlay with premium backdrop blur */}
      <div 
        className="absolute inset-0 bg-[#0a0a0a]/50 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* World-class Clean Card - Optimized for iPad Landscape */}
      <div className="animate-in zoom-in-95 relative flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white text-gray-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border border-gray-100 duration-300 font-sans">
        
        {/* Header - Minimalist & Clean */}
        <header className="relative flex items-center justify-between border-b border-gray-50 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white">
              <FlaskConical size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">
                {t.title}
              </h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 hover:text-black border border-gray-200 active:scale-95 transition-all shadow-sm"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </header>

        {/* Content Area - Clean spaces */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
          
          {/* Top Panel - Ultra-clean branding info */}
          <div className="flex items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  crossOrigin="anonymous"
                  className="h-12 w-12 object-cover rounded-2xl border border-gray-100"
                />
              ) : null}
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  {getPrimaryMenuName(item)}
                </h3>
                {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                  </p>
                )}
              </div>
            </div>

            {/* Clean Order Type Tag */}
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                {t.orderTypeLabel}
              </span>
              <span className="text-xs font-bold text-gray-900 uppercase bg-gray-50 border border-gray-100 px-3 py-1 rounded-xl shadow-sm">
                {getOrderTypeLabel(orderType)}
              </span>
            </div>
          </div>

          {!hasAnyRecipe ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border border-gray-100 bg-gray-50/50 rounded-2xl">
              <AlertTriangle size={24} className="mb-2 text-amber-500 opacity-60" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.noRecipe}</p>
            </div>
          ) : (
            /* Split layout: left side is Main Recipe, right side is custom options */
            <div className={`grid grid-cols-1 ${hasMainRecipe && hasModifierRecipes ? 'md:grid-cols-2' : 'sm:grid-cols-2'} gap-8`}>
              
              {/* Left Column: Main Recipe */}
              {hasMainRecipe && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t.mainRecipe}
                  </h4>
                  
                  <div className="divide-y divide-gray-50">
                    {mainRecipeData.map((ing, idx) => {
                      const active = isIngActive(ing);
                      const displayQty = (Number(ing.quantity) || 0).toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      });

                      return (
                        <div 
                          key={ing.ingredient_id || idx}
                          className={`flex items-center justify-between py-3 transition-all ${
                            active ? 'opacity-100' : 'opacity-25 select-none'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {/* Quantity Pill - Soft Light Green Accent */}
                            <div className={`shrink-0 min-w-[70px] text-center px-2.5 py-1.5 rounded-xl text-xs font-extrabold tracking-tight ${
                              active 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {displayQty} {ing.recipe_unit || ing.base_unit || ''}
                            </div>

                            <span className={`font-semibold text-sm truncate ${
                              active ? 'text-gray-800' : 'text-gray-400 line-through'
                            }`}>
                              {ing.name}
                            </span>
                          </div>

                          {/* Inactive label */}
                          {!active && (
                            <span className="shrink-0 bg-gray-50 text-gray-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-gray-100">
                              {t.notUsed}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Right Column: Custom Option Recipes */}
              {hasModifierRecipes ? (
                <div className="space-y-6 md:border-l md:border-gray-100 md:pl-8">
                  {modifierRecipes.map((mod, modIdx) => (
                    <div key={modIdx} className="space-y-4">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        {t.modifierRecipe}: <span className="text-gray-950 font-bold underline">{mod.name}</span>
                      </h4>

                      <div className="divide-y divide-gray-50">
                        {mod.recipe_data.map((ing, idx) => {
                          const active = isIngActive(ing);
                          const totalQty = (Number(ing.quantity) || 0) * mod.qty;
                          const displayQty = totalQty.toLocaleString(undefined, {
                            maximumFractionDigits: 3,
                          });

                          return (
                            <div 
                              key={ing.ingredient_id || idx}
                              className={`flex items-center justify-between py-3 transition-all ${
                                active ? 'opacity-100' : 'opacity-25 select-none'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                {/* Quantity Pill - Soft Light Indigo Accent */}
                                <div className={`shrink-0 min-w-[70px] text-center px-2.5 py-1.5 rounded-xl text-xs font-extrabold tracking-tight ${
                                  active 
                                    ? 'bg-indigo-50 text-indigo-700' 
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {displayQty} {ing.recipe_unit || ing.base_unit || ''}
                                </div>

                                <span className={`font-semibold text-sm truncate ${
                                  active ? 'text-gray-800' : 'text-gray-400 line-through'
                                }`}>
                                  {ing.name}
                                </span>
                              </div>

                              {/* Inactive label */}
                              {!active && (
                                <span className="shrink-0 bg-gray-50 text-gray-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-gray-100">
                                  {t.notUsed}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
