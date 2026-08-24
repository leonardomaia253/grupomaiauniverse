-- Create custom types
CREATE TYPE keoto_campaign_status AS ENUM ('new', 'processed', 'failed', 'ignored');
CREATE TYPE clip_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'posted');

-- Campaigns Table
CREATE TABLE IF NOT EXISTS keoto_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    keoto_link TEXT UNIQUE NOT NULL,
    reward TEXT,
    status keoto_campaign_status DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clips Table
CREATE TABLE IF NOT EXISTS clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES keoto_campaigns(id) ON DELETE CASCADE,
    source_video_url TEXT,
    video_path TEXT, -- Storage path or local path placeholder
    transcript JSONB,
    status clip_status DEFAULT 'pending',
    platforms_posted TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE keoto_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- Basic policies (assuming admin access for backend and authenticated for frontend)
CREATE POLICY "Public read access for campaigns" ON keoto_campaigns FOR SELECT USING (true);
CREATE POLICY "Public read access for clips" ON clips FOR SELECT USING (true);
;
