-- Migration created on 2025-08-20
-- Auto-generated from new.sql
-- alter users table

-- Add your SQL statements here
ALTER TABLE users
ADD COLUMN escrow_address TEXT NOT NULL;