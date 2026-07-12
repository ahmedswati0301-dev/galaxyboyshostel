
ALTER VIEW public.room_occupancy SET (security_invoker = on);

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['room_types','rooms','students','payments','activity_logs','settings']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "auth read" ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "auth insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "auth update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "auth delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)', t);
  END LOOP;
END $$;
