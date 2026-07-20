
-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed BIGINT NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'warzone',
  difficulty TEXT NOT NULL DEFAULT 'sergeant',
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','playing','ended')),
  turn_slot INT NOT NULL DEFAULT 0,
  max_players INT NOT NULL DEFAULT 4 CHECK (max_players BETWEEN 2 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE TABLE public.match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot INT NOT NULL CHECK (slot BETWEEN 0 AND 3),
  nickname TEXT NOT NULL,
  char_id TEXT NOT NULL DEFAULT 'ranger',
  ready BOOLEAN NOT NULL DEFAULT false,
  hp INT NOT NULL DEFAULT 100,
  connected BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, slot),
  UNIQUE (match_id, user_id)
);

CREATE INDEX idx_match_players_match ON public.match_players(match_id);
CREATE INDEX idx_matches_code ON public.matches(code);

-- Membership helper (SECURITY DEFINER to avoid recursion on match_players policies)
CREATE OR REPLACE FUNCTION public.is_match_member(_match_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.match_players
    WHERE match_id = _match_id AND user_id = _user_id
  );
$$;

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_players TO authenticated;
GRANT ALL ON public.match_players TO service_role;

-- RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- matches policies
CREATE POLICY "members can view match" ON public.matches
  FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR public.is_match_member(id, auth.uid()));

CREATE POLICY "authenticated can create match" ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "host can update match" ON public.matches
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "host can delete match" ON public.matches
  FOR DELETE TO authenticated
  USING (host_id = auth.uid());

-- match_players policies
CREATE POLICY "members can view players" ON public.match_players
  FOR SELECT TO authenticated
  USING (public.is_match_member(match_id, auth.uid()));

CREATE POLICY "user can insert self as player" ON public.match_players
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user can update own player row" ON public.match_players
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user or host can delete player row" ON public.match_players
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.host_id = auth.uid())
  );

-- Join by code RPC
CREATE OR REPLACE FUNCTION public.join_match_by_code(_code TEXT, _nickname TEXT, _char_id TEXT DEFAULT 'ranger')
RETURNS TABLE (match_id UUID, slot INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.matches%ROWTYPE;
  next_slot INT;
  existing public.match_players%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO m FROM public.matches WHERE upper(code) = upper(_code);
  IF NOT FOUND THEN RAISE EXCEPTION 'Sala não encontrada'; END IF;
  IF m.status = 'ended' THEN RAISE EXCEPTION 'Partida encerrada'; END IF;

  -- Already joined?
  SELECT * INTO existing FROM public.match_players WHERE match_players.match_id = m.id AND match_players.user_id = auth.uid();
  IF FOUND THEN
    UPDATE public.match_players SET connected = true, nickname = _nickname, char_id = _char_id
      WHERE id = existing.id;
    RETURN QUERY SELECT m.id, existing.slot;
    RETURN;
  END IF;

  IF m.status <> 'lobby' THEN RAISE EXCEPTION 'Partida em andamento'; END IF;

  -- Find first free slot
  SELECT s.n INTO next_slot
  FROM generate_series(0, m.max_players - 1) AS s(n)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.match_players p WHERE p.match_id = m.id AND p.slot = s.n
  )
  ORDER BY s.n
  LIMIT 1;

  IF next_slot IS NULL THEN RAISE EXCEPTION 'Sala cheia'; END IF;

  INSERT INTO public.match_players (match_id, user_id, slot, nickname, char_id)
  VALUES (m.id, auth.uid(), next_slot, _nickname, _char_id);

  RETURN QUERY SELECT m.id, next_slot;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_match_by_code(TEXT, TEXT, TEXT) TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_players;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.match_players REPLICA IDENTITY FULL;
