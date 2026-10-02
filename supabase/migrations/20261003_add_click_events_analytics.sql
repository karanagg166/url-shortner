-- Migration: Add click_events table, indexes, RLS, increment_clicks and get_url_analytics
-- Date: 2026-10-03

-- 1. Create click_events table
CREATE TABLE IF NOT EXISTS public.click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID NOT NULL REFERENCES public.urls(id) ON DELETE CASCADE,
    short_code TEXT NOT NULL,
    clicked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    visitor_hash TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    referrer TEXT,
    referrer_domain TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT
);

-- 2. Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_click_events_url_id ON public.click_events(url_id);
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON public.click_events(clicked_at);
CREATE INDEX IF NOT EXISTS idx_click_events_url_clicked ON public.click_events(url_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_url_visitor ON public.click_events(url_id, visitor_hash);
CREATE INDEX IF NOT EXISTS idx_click_events_short_code ON public.click_events(short_code);

-- 3. Enable RLS and setup policies
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'click_events' AND policyname = 'Allow public insert to click_events'
    ) THEN
        CREATE POLICY "Allow public insert to click_events" 
        ON public.click_events FOR INSERT 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'click_events' AND policyname = 'Users can view click events of their URLs'
    ) THEN
        CREATE POLICY "Users can view click events of their URLs" 
        ON public.click_events FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.urls 
                WHERE public.urls.id = public.click_events.url_id 
                AND public.urls.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'click_events' AND policyname = 'Users can delete click events of their URLs'
    ) THEN
        CREATE POLICY "Users can delete click events of their URLs" 
        ON public.click_events FOR DELETE 
        USING (
            EXISTS (
                SELECT 1 FROM public.urls 
                WHERE public.urls.id = public.click_events.url_id 
                AND public.urls.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 4. Atomic click counter function
CREATE OR REPLACE FUNCTION public.increment_clicks(slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.urls
    SET clicks_count = clicks_count + 1,
        updated_at = NOW()
    WHERE short_code = slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Stored function for analytics queries
CREATE OR REPLACE FUNCTION public.get_url_analytics(
    p_url_id UUID,
    p_range TEXT DEFAULT '30d'
)
RETURNS JSON AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_total_clicks BIGINT;
    v_unique_visitors BIGINT;
    v_clicks_today BIGINT;
    v_clicks_7d BIGINT;
    v_clicks_30d BIGINT;
    v_bot_clicks BIGINT;
    v_last_clicked_at TIMESTAMPTZ;
    v_timeline JSON;
    v_countries JSON;
    v_cities JSON;
    v_referrers JSON;
    v_devices JSON;
    v_browsers JSON;
    v_os JSON;
    v_recent_clicks JSON;
    v_result JSON;
BEGIN
    IF p_range = '7d' THEN
        v_start_time := NOW() - INTERVAL '7 days';
    ELSIF p_range = '90d' THEN
        v_start_time := NOW() - INTERVAL '90 days';
    ELSIF p_range = 'all' THEN
        v_start_time := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
    ELSE
        v_start_time := NOW() - INTERVAL '30 days';
    END IF;

    SELECT
        COUNT(*),
        COUNT(DISTINCT visitor_hash),
        COUNT(*) FILTER (WHERE clicked_at >= CURRENT_DATE AT TIME ZONE 'UTC'),
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '7 days'),
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '30 days'),
        COUNT(*) FILTER (WHERE device_type = 'Bot'),
        MAX(clicked_at)
    INTO
        v_total_clicks,
        v_unique_visitors,
        v_clicks_today,
        v_clicks_7d,
        v_clicks_30d,
        v_bot_clicks,
        v_last_clicked_at
    FROM public.click_events
    WHERE url_id = p_url_id;

    IF v_total_clicks = 0 THEN
        SELECT clicks_count INTO v_total_clicks FROM public.urls WHERE id = p_url_id;
        v_total_clicks := COALESCE(v_total_clicks, 0);
    END IF;

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_timeline
    FROM (
        SELECT
            to_char(date_trunc('day', clicked_at), 'YYYY-MM-DD') AS date,
            COUNT(*) AS clicks
        FROM public.click_events
        WHERE url_id = p_url_id AND clicked_at >= v_start_time
        GROUP BY date_trunc('day', clicked_at)
        ORDER BY date_trunc('day', clicked_at) ASC
    ) t;

    SELECT COALESCE(json_agg(c), '[]'::json) INTO v_countries
    FROM (
        SELECT
            COALESCE(NULLIF(country, ''), 'Unknown') AS country,
            COUNT(*) AS clicks,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.click_events WHERE url_id = p_url_id AND clicked_at >= v_start_time), 0), 1) AS percentage
        FROM public.click_events
        WHERE url_id = p_url_id AND clicked_at >= v_start_time
        GROUP BY country
        ORDER BY clicks DESC
        LIMIT 10
    ) c;

    SELECT COALESCE(json_agg(ci), '[]'::json) INTO v_cities
    FROM (
        SELECT
            city,
            COALESCE(NULLIF(country, ''), 'Unknown') AS country,
            COUNT(*) AS clicks
        FROM public.click_events
        WHERE url_id = p_url_id AND clicked_at >= v_start_time AND city IS NOT NULL AND city != ''
        GROUP BY city, country
        ORDER BY clicks DESC
        LIMIT 10
    ) ci;

    SELECT COALESCE(json_agg(r), '[]'::json) INTO v_referrers
    FROM (
        SELECT
            COALESCE(NULLIF(referrer_domain, ''), 'Direct') AS source,
            COUNT(*) AS clicks,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.click_events WHERE url_id = p_url_id AND clicked_at >= v_start_time), 0), 1) AS percentage
        FROM public.click_events
        WHERE url_id = p_url_id AND clicked_at >= v_start_time
        GROUP BY referrer_domain
        ORDER BY clicks DESC
        LIMIT 10
    ) r;

    SELECT COALESCE(json_agg(d), '[]'::json) INTO v_devices
    FROM (
        SELECT
            COALESCE(NULLIF(device_type, ''), 'Unknown') AS device,
            COUNT(*) AS clicks,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.click_events WHERE url_id = p_url_id AND clicked_at >= v_start_time), 0), 1) AS percentage
        FROM public.click_events
        WHERE url_id = p_url_id AND clicked_at >= v_start_time
        GROUP BY device_type
        ORDER BY clicks DESC
    ) d;

    SELECT COALESCE(json_agg(b), '[]'::json) INTO v_browsers
    FROM (
        SELECT
            COALESCE(NULLIF(browser, ''), 'Other') AS browser,
            COUNT(*) AS clicks,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.click_events WHERE url_id = p_url_id AND clicked_at >= v_start_time), 0), 1) AS percentage
        FROM public.click_events
        WHERE url_id = p_url_id AND clicked_at >= v_start_time
        GROUP BY browser
        ORDER BY clicks DESC
    ) b;

    SELECT COALESCE(json_agg(o), '[]'::json) INTO v_os
    FROM (
        SELECT
            COALESCE(NULLIF(os, ''), 'Other') AS os,
            COUNT(*) AS clicks,
            ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.click_events WHERE url_id = p_url_id AND clicked_at >= v_start_time), 0), 1) AS percentage
        FROM public.click_events
        WHERE url_id = p_url_id AND clicked_at >= v_start_time
        GROUP BY os
        ORDER BY clicks DESC
    ) o;

    SELECT COALESCE(json_agg(rc), '[]'::json) INTO v_recent_clicks
    FROM (
        SELECT
            clicked_at,
            country,
            region,
            city,
            COALESCE(NULLIF(referrer_domain, ''), 'Direct') AS referrer_domain,
            referrer,
            device_type,
            browser,
            os
        FROM public.click_events
        WHERE url_id = p_url_id
        ORDER BY clicked_at DESC
        LIMIT 20
    ) rc;

    v_result := json_build_object(
        'total_clicks', COALESCE(v_total_clicks, 0),
        'unique_visitors', COALESCE(v_unique_visitors, 0),
        'clicks_today', COALESCE(v_clicks_today, 0),
        'clicks_7d', COALESCE(v_clicks_7d, 0),
        'clicks_30d', COALESCE(v_clicks_30d, 0),
        'bot_clicks', COALESCE(v_bot_clicks, 0),
        'last_clicked_at', v_last_clicked_at,
        'timeline', v_timeline,
        'countries', v_countries,
        'cities', v_cities,
        'referrers', v_referrers,
        'devices', v_devices,
        'browsers', v_browsers,
        'operating_systems', v_os,
        'recent_clicks', v_recent_clicks
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
