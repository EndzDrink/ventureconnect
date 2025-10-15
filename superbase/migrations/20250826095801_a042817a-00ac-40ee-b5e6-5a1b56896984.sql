-- Fix function search path issues by adding SECURITY DEFINER SET search_path = public

-- Drop and recreate handle_new_user function with proper search_path
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Traveler_' || substring(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$;

-- Drop and recreate update_updated_at_column function with proper search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;