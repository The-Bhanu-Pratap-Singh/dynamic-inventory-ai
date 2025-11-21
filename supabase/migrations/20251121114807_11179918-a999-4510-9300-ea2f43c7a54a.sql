-- Create audit_logs table for tracking security events
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Create function to log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
    VALUES (
      auth.uid(),
      'ROLE_ASSIGNED',
      'user_roles',
      NEW.user_id,
      jsonb_build_object(
        'role', NEW.role,
        'assigned_to_user_id', NEW.user_id
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
    VALUES (
      auth.uid(),
      'ROLE_REMOVED',
      'user_roles',
      OLD.user_id,
      jsonb_build_object(
        'role', OLD.role,
        'removed_from_user_id', OLD.user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for role changes
CREATE TRIGGER audit_role_changes
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION log_role_change();

-- Create secure RPC function to get users with roles
CREATE OR REPLACE FUNCTION get_users_with_roles()
RETURNS TABLE (
  id uuid,
  full_name text,
  roles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return users with their roles
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    COALESCE(
      jsonb_agg(
        DISTINCT ur.role
      ) FILTER (WHERE ur.role IS NOT NULL),
      '[]'::jsonb
    ) as roles
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  GROUP BY p.id, p.full_name
  ORDER BY p.full_name;
END;
$$;

-- Create secure RPC function to assign role
CREATE OR REPLACE FUNCTION assign_user_role(target_user_id uuid, target_role app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if the current user is an admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log unauthorized attempt if trying to assign admin role inappropriately
  IF target_role = 'admin'::app_role THEN
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
    VALUES (
      auth.uid(),
      'ADMIN_ROLE_ASSIGNMENT_ATTEMPT',
      'user_roles',
      target_user_id,
      jsonb_build_object(
        'role', target_role,
        'assigned_by', auth.uid(),
        'assigned_to', target_user_id
      )
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Role assigned successfully');
END;
$$;

-- Create secure RPC function to remove role
CREATE OR REPLACE FUNCTION remove_user_role(target_user_id uuid, target_role app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Prevent removing own admin role
  IF target_user_id = auth.uid() AND target_role = 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot remove your own admin role.';
  END IF;

  -- Delete the role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = target_role;

  RETURN jsonb_build_object('success', true, 'message', 'Role removed successfully');
END;
$$;