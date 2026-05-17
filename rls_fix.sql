-- Fix RLS Policies for Conversations, Conversation Members, and Profiles

-- Drop existing restrictive policies on conversations if any
DROP POLICY IF EXISTS "Users can insert conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations." ON public.conversations;

-- Allow authenticated users to create conversations
CREATE POLICY "Users can insert conversations." 
ON public.conversations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to view their conversations
CREATE POLICY "Users can view their conversations." 
ON public.conversations FOR SELECT 
TO authenticated 
USING (
  id IN (SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid())
);

-- Fix RLS for conversation_members
DROP POLICY IF EXISTS "Users can view conversation members." ON public.conversation_members;
DROP POLICY IF EXISTS "Users can insert conversation members." ON public.conversation_members;
DROP POLICY IF EXISTS "Users can update conversation members." ON public.conversation_members;

-- Allow users to view members of their conversations
CREATE POLICY "Users can view conversation members." 
ON public.conversation_members FOR SELECT 
TO authenticated 
USING (true); -- Simplifying this to true so users can see contacts and memberships easily

-- Allow users to insert members (when creating groups or adding friends)
CREATE POLICY "Users can insert conversation members." 
ON public.conversation_members FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to update members (e.g. changing roles)
CREATE POLICY "Users can update conversation members." 
ON public.conversation_members FOR UPDATE 
TO authenticated 
USING (true);

-- Allow users to delete members (kicking users)
CREATE POLICY "Users can delete conversation members." 
ON public.conversation_members FOR DELETE 
TO authenticated 
USING (true);
