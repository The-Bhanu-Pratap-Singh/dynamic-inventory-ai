-- Allow users to self-assign non-admin roles during signup
-- This fixes the issue where new users cannot insert their default role

CREATE POLICY "Users can self-assign non-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND role != 'admin'::app_role
);