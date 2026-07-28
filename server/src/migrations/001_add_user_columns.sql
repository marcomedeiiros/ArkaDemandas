-- Migration: Add user tracking columns
-- Created: 2026-07-28

-- Add criado_por column to demands table
ALTER TABLE demands ADD COLUMN criado_por TEXT DEFAULT 'Sistema';

-- Add user column to activity_logs table  
ALTER TABLE activity_logs ADD COLUMN user TEXT DEFAULT 'Sistema';

-- Update existing records
UPDATE demands SET criado_por = 'Sistema' WHERE criado_por IS NULL;
UPDATE activity_logs SET user = 'Sistema' WHERE user IS NULL;
