-- ============================================================
-- Skycord Admin & Messages Fix
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Fix messages RLS so authenticated users can send messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for members" ON public.messages;
CREATE POLICY "Allow insert for members" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow select for members" ON public.messages;
CREATE POLICY "Allow select for members" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
  );

-- 2. Also allow RLS insert on conversation_members for joining groups
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view" ON public.conversation_members;
CREATE POLICY "Allow members to view" ON public.conversation_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow self-join" ON public.conversation_members;
CREATE POLICY "Allow self-join" ON public.conversation_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin to insert members" ON public.conversation_members;
CREATE POLICY "Allow admin to insert members" ON public.conversation_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.group_role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin to update members" ON public.conversation_members;
CREATE POLICY "Allow admin to update members" ON public.conversation_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.group_role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin to delete members" ON public.conversation_members;
CREATE POLICY "Allow admin to delete members" ON public.conversation_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.group_role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Mark the Skycord account as global admin and verified
-- Replace 'skycord' with the exact username of your Skycord account
UPDATE public.profiles
SET role = 'admin', is_verified = true
WHERE username = 'skycord';

-- 4. Add the Skycord admin account to EVERY group and subgroup
-- (Run AFTER step 3 so the profile update takes effect)
INSERT INTO public.conversation_members (conversation_id, user_id, group_role)
SELECT c.id, p.id, 'admin'
FROM public.conversations c, public.profiles p
WHERE c.is_group = true
  AND p.username = 'skycord'
  AND NOT EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = c.id AND cm.user_id = p.id
  );
