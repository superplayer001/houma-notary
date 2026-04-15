-- Video Sessions Tables for PR-11
-- Mock provider abstraction (no real cloud RTC integration)
-- NOTE: This migration depends on base_tables migration (20240417000000)
-- which creates the `staff` and `cases` tables referenced below.

-- Video Session Participants Enum
CREATE TYPE video_participant_type AS ENUM (
    'APPLICANT',      -- 申请人（群众端用户）
    'STAFF',          -- 公证员/工作人员
    'WITNESS'         -- 见证人
);

-- Video Session Status Enum
CREATE TYPE video_session_status AS ENUM (
    'READY',          -- 已创建，等待开始
    'IN_PROGRESS',    -- 进行中
    'COMPLETED',      -- 已完成
    'ABORTED',        -- 被中止
    'CANCELLED'       -- 已取消
);

-- Video Session Events Enum
CREATE TYPE video_session_event_type AS ENUM (
    'CREATED',                    -- 会话创建
    'STARTED',                    -- 开始
    'COMPLETED',                  -- 完成
    'ABORTED',                    -- 中止
    'CANCELLED',                  -- 取消
    'RECORDING_READY',            -- 录制就绪
    'JOINED',                     -- 参与者加入
    'LEFT'                        -- 参与者离开
);

-- Video Sessions Table
CREATE TABLE video_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    room_id VARCHAR(255) NOT NULL,                    -- 第三方RTC房间ID（mock生成）
    status video_session_status NOT NULL DEFAULT 'READY',
    scheduled_at TIMESTAMP WITH TIME ZONE,            -- 计划开始时间
    started_at TIMESTAMP WITH TIME ZONE,              -- 实际开始时间
    ended_at TIMESTAMP WITH TIME ZONE,                -- 结束时间
    duration_seconds INTEGER,                         -- 持续时长（秒）
    recording_url VARCHAR(1024),                       -- 录制文件URL（mock生成）
    recording_ready BOOLEAN NOT NULL DEFAULT FALSE,
    max_participants INTEGER NOT NULL DEFAULT 4,
    created_by UUID NOT NULL REFERENCES staff(id),     -- 创建人
    abort_reason VARCHAR(512),                        -- 中止/取消原因
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT one_active_per_case UNIQUE (case_id) WHERE status IN ('READY', 'IN_PROGRESS')
);

-- Video Session Participants Table
-- Column names aligned with Rust VideoSessionParticipant struct fields:
--   participant_id  -> 对应 users.id 或 staff.id
--   participant_type -> VIDEO_PARTICIPANT_TYPE enum
--   join_token     -> 参与 Token（mock生成）
--   display_name   -> 参与者显示名称
CREATE TABLE video_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL,                     -- 用户或员工ID
    participant_type video_participant_type NOT NULL,
    display_name VARCHAR(128) NOT NULL,               -- 显示名称
    join_token VARCHAR(512) NOT NULL,                 -- 参与Token（mock生成）
    token_expired_at TIMESTAMP WITH TIME ZONE,        -- Token过期时间
    joined_at TIMESTAMP WITH TIME ZONE,               -- 加入时间
    left_at TIMESTAMP WITH TIME ZONE,                 -- 离开时间
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_participant_per_session UNIQUE (video_session_id, participant_id)
);

-- Video Session Events Table (事件日志)
-- Column names aligned with Rust VideoSessionEvent struct fields:
--   operator_type  -> USER/STAFF/SYSTEM
--   operator_id    -> 触发事件的操作用户ID
--   detail_json    -> 额外事件数据
CREATE TABLE video_session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
    event_type video_session_event_type NOT NULL,
    operator_type VARCHAR(20),                        -- USER/STAFF/SYSTEM
    operator_id UUID,                                 -- 触发事件的用户ID
    detail_json JSONB DEFAULT '{}',                  -- 额外事件数据
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_sessions_case_id ON video_sessions(case_id);
CREATE INDEX idx_video_sessions_status ON video_sessions(status);
CREATE INDEX idx_video_sessions_room_id ON video_sessions(room_id);
CREATE INDEX idx_video_session_participants_session_id ON video_session_participants(video_session_id);
CREATE INDEX idx_video_session_participants_participant_id ON video_session_participants(participant_id);
CREATE INDEX idx_video_session_events_session_id ON video_session_events(video_session_id);
CREATE INDEX idx_video_session_events_type ON video_session_events(event_type);

-- Comments
COMMENT ON TABLE video_sessions IS '视频会话表';
COMMENT ON TABLE video_session_participants IS '视频会话参与者表';
COMMENT ON TABLE video_session_events IS '视频会话事件日志表';
COMMENT ON COLUMN video_sessions.room_id IS '第三方RTC房间ID，MVP使用mock生成';
COMMENT ON COLUMN video_sessions.recording_url IS '录制文件URL，MVP使用mock生成';
COMMENT ON COLUMN video_sessions.max_participants IS '最大参与人数，默认4人';
COMMENT ON COLUMN video_session_participants.participant_id IS '参与者ID，可能是users或staff表的UUID';
COMMENT ON COLUMN video_session_participants.join_token IS 'RTC参与Token，MVP使用mock生成';
