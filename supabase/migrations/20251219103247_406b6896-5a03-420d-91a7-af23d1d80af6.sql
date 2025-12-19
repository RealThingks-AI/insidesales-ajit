-- Update the handle_new_user function to better extract display names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, "Email ID")
  VALUES (
    NEW.id,
    COALESCE(
      -- Try full_name first
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      -- Then try name
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      -- Then try display_name
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      -- Extract name from email as last resort (before @)
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.email
  );
  RETURN NEW;
END;
$$;