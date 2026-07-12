-- The project still has legacy default privileges that automatically expose
-- new public tables to anon and grant more than the frontend needs. RLS already
-- restricts rows to strict admins; make the table-level privileges match.

REVOKE ALL ON TABLE public.product_todos FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_todos TO authenticated;
