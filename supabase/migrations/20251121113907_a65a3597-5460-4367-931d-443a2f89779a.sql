-- Add RLS policy to prevent users from self-assigning admin role
-- This prevents privilege escalation attacks

CREATE POLICY "Prevent self-assigned admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow non-admin roles during signup
  -- Admins can only be created by existing admins (handled by existing policy)
  role != 'admin'::app_role
);