
-- Enums
CREATE TYPE public.payment_method AS ENUM ('cash','bank','jazzcash','easypaisa');
CREATE TYPE public.student_status AS ENUM ('active','vacated');

-- ROOM TYPES
CREATE TABLE public.room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  capacity int NOT NULL,
  default_rent numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_types TO authenticated;
GRANT ALL ON public.room_types TO service_role;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all" ON public.room_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ROOMS
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  floor int NOT NULL,
  room_type_id uuid NOT NULL REFERENCES public.room_types(id),
  rent_per_seat numeric(10,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all" ON public.rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  father_name text,
  phone text,
  cnic text,
  emergency_contact text,
  address text,
  university text,
  department text,
  photo_url text,
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  room_id uuid REFERENCES public.rooms(id),
  seat_number int,
  monthly_rent numeric(10,2) NOT NULL,
  status public.student_status NOT NULL DEFAULT 'active',
  vacated_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, seat_number, status) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX ON public.students (room_id);
CREATE INDEX ON public.students (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  month date NOT NULL, -- first day of month
  amount numeric(10,2) NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'cash',
  paid_at timestamptz NOT NULL DEFAULT now(),
  receipt_no text NOT NULL UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, month)
);
CREATE INDEX ON public.payments (month);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ACTIVITY LOG
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  message text NOT NULL,
  ref_student uuid,
  ref_room uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.activity_logs (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SETTINGS
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Receipt sequence
CREATE SEQUENCE public.receipt_seq;
GRANT USAGE ON SEQUENCE public.receipt_seq TO authenticated, service_role;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER students_touch BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- View: room occupancy
CREATE OR REPLACE VIEW public.room_occupancy AS
SELECT
  r.id,
  r.number,
  r.floor,
  r.room_type_id,
  rt.name as room_type,
  rt.capacity,
  COALESCE(r.rent_per_seat, rt.default_rent) as rent_per_seat,
  COALESCE((SELECT count(*) FROM public.students s WHERE s.room_id = r.id AND s.status = 'active'),0)::int as occupied,
  (rt.capacity - COALESCE((SELECT count(*) FROM public.students s WHERE s.room_id = r.id AND s.status = 'active'),0))::int as available
FROM public.rooms r
JOIN public.room_types rt ON rt.id = r.room_type_id;
GRANT SELECT ON public.room_occupancy TO authenticated, service_role;

-- Seeds
INSERT INTO public.room_types (name, capacity, default_rent) VALUES
 ('2 Seater', 2, 18000),
 ('3 Seater', 3, 15000),
 ('4 Seater', 4, 13000);

INSERT INTO public.rooms (number, floor, room_type_id)
SELECT n, f, rt.id FROM (VALUES
  ('101',1,'2 Seater'),
  ('102',1,'3 Seater'),
  ('103',1,'4 Seater'),
  ('201',2,'3 Seater'),
  ('202',2,'2 Seater'),
  ('203',2,'3 Seater'),
  ('301',3,'4 Seater'),
  ('302',3,'3 Seater'),
  ('303',3,'2 Seater')
) v(n,f,tname)
JOIN public.room_types rt ON rt.name = v.tname;

INSERT INTO public.settings (key, value) VALUES
 ('hostel', '{"name":"Sky Boys Hostel","currency":"Rs."}'::jsonb);
