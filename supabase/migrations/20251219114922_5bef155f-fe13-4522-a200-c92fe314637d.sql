-- Add email column to accounts table
ALTER TABLE public.accounts
ADD COLUMN email TEXT;