-- Restreindre l'exécution des fonctions SECURITY DEFINER

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_company_client(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_client(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_client_companies(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_client_companies(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;