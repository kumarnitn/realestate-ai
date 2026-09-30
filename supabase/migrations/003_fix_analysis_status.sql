-- 003_fix_analysis_status.sql
-- Fix the default value of analysis_status to allow NULL and reset incorrectly pending leads

ALTER TABLE public.leads 
ALTER COLUMN analysis_status DROP DEFAULT;

UPDATE public.leads 
SET analysis_status = NULL 
WHERE analysis_status = 'pending';
