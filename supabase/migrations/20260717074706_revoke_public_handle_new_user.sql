-- This function is invoked only by the auth.users trigger and must not be
-- exposed as a public RPC endpoint.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
