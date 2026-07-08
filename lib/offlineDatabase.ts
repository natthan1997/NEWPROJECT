import Dexie, { Table } from 'dexie'

export interface OfflineOrder {
  id: string
  payload: any // The JSON payload that would have been sent to Supabase (orders, order_items, payments)
  createdAt: string
  syncStatus: 'pending' | 'synced' | 'error'
  errorMessage?: string
}

export interface CachedCategory {
  id: string
  name: string
  order_index: number
}

export interface CachedMenuItem {
  id: string
  name: string
  price: number
  category_id: string
  image_url?: string
  is_active: boolean
  is_available: boolean
}

export interface CachedModifierGroup {
  id: string
  name: string
  is_multiple: boolean
  is_required: boolean
  order_index: number
}

export interface CachedModifier {
  id: string
  group_id: string
  name: string
  price: number
  is_active: boolean
  order_index: number
}

export interface CachedItemModifierLink {
  item_id: string
  group_id: string
}

export class XylPOSDatabase extends Dexie {
  offline_orders!: Table<OfflineOrder, string>
  menu_categories!: Table<CachedCategory, string>
  menu_items!: Table<CachedMenuItem, string>
  modifier_groups!: Table<CachedModifierGroup, string>
  modifiers!: Table<CachedModifier, string>
  item_modifier_links!: Table<CachedItemModifierLink, [string, string]> // Compound key

  constructor() {
    super('XylPOSDatabase')
    
    // Define tables and indexes
    this.version(1).stores({
      offline_orders: 'id, syncStatus, createdAt',
      menu_categories: 'id, order_index',
      menu_items: 'id, category_id',
      modifier_groups: 'id',
      modifiers: 'id, group_id',
      item_modifier_links: '[item_id+group_id], item_id, group_id'
    })
  }
}

export const db = new XylPOSDatabase()
