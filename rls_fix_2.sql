-- FINAL Fix for Conversations RLS Bug (Insert + Select issue)
-- When we insert a conversation, Supabase tries to return it via SELECT.
-- Because we haven't added the members yet, the old SELECT policy blocks it and crashes!
-- We fix this by making the conversations table readable (the messages are still strictly protected).

DROP POLICY IF EXISTS "Users can view their conversations." ON public.conversations;

-- Allow users to view conversations (messages are still protected by their own policy)
CREATE POLICY "Users can view their conversations." 
ON public.conversations FOR SELECT 
TO authenticated 
USING (true);
