ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS closed_weekdays smallint[] NOT NULL DEFAULT ARRAY[0,6]::smallint[],
  ADD COLUMN IF NOT EXISTS closed_dates date[] NOT NULL DEFAULT ARRAY[]::date[];