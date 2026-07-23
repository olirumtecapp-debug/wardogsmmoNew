GRANT EXECUTE ON FUNCTION public.is_match_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_match_by_code(text, text, text) TO authenticated, service_role;