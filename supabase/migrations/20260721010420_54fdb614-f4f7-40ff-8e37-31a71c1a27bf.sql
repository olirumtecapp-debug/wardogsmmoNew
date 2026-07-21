-- Restrict SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.join_match_by_code(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_match_member(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Remove anonymous access to game tables (only authenticated users should touch them)
REVOKE ALL ON public.matches FROM anon;
REVOKE ALL ON public.match_players FROM anon;