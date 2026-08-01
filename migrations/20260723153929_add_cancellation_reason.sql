-- Migration: Add cancellation_reason to pos_orders
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
