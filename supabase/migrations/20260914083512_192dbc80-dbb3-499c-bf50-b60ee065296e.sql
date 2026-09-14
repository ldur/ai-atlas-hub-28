CREATE POLICY "No public access to admin_login_attempts"
ON public.admin_login_attempts
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);