-- Auto-friending trigger for AndrewRusher and Skycord

CREATE OR REPLACE FUNCTION auto_add_global_friends() 
RETURNS TRIGGER AS $$
DECLARE
  andrew_id UUID;
  skycord_id UUID;
BEGIN
  -- Find the IDs of the global accounts (case insensitive)
  SELECT id INTO andrew_id FROM public.profiles WHERE username ILIKE 'AndrewRusher' LIMIT 1;
  SELECT id INTO skycord_id FROM public.profiles WHERE username ILIKE 'Skycord' LIMIT 1;

  -- Add AndrewRusher if exists and not self
  IF andrew_id IS NOT NULL AND andrew_id != NEW.id THEN
    INSERT INTO public.relationships (user_id, friend_id, status) 
    VALUES (NEW.id, andrew_id, 'accepted')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add Skycord if exists and not self
  IF skycord_id IS NOT NULL AND skycord_id != NEW.id THEN
    INSERT INTO public.relationships (user_id, friend_id, status) 
    VALUES (NEW.id, skycord_id, 'accepted')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS on_profile_created_add_friends ON public.profiles;
CREATE TRIGGER on_profile_created_add_friends
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION auto_add_global_friends();

-- Apply it retroactively to ALL current users
DO $$
DECLARE
  andrew_id UUID;
  skycord_id UUID;
  user_record RECORD;
BEGIN
  SELECT id INTO andrew_id FROM public.profiles WHERE username ILIKE 'AndrewRusher' LIMIT 1;
  SELECT id INTO skycord_id FROM public.profiles WHERE username ILIKE 'Skycord' LIMIT 1;

  FOR user_record IN SELECT id FROM public.profiles LOOP
    IF andrew_id IS NOT NULL AND andrew_id != user_record.id THEN
      INSERT INTO public.relationships (user_id, friend_id, status) 
      VALUES (user_record.id, andrew_id, 'accepted')
      ON CONFLICT DO NOTHING;
    END IF;

    IF skycord_id IS NOT NULL AND skycord_id != user_record.id THEN
      INSERT INTO public.relationships (user_id, friend_id, status) 
      VALUES (user_record.id, skycord_id, 'accepted')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
