-- Base Tables Migration for houma-notary
-- Reference: Java backend (gzc-fq-admin) entity definitions
-- Order: Run this BEFORE 20240417000001_create_video_sessions

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');
CREATE TYPE staff_role AS ENUM ('ADMIN', 'NOTARY', 'CLERK', 'AUDITOR');
CREATE TYPE staff_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE application_status AS ENUM (
    'DRAFT',                  -- 草稿
    'SUBMITTED',              -- 已提交待审核
    'SUPPLEMENT_REQUIRED',     -- 需补件
    'PENDING',                -- 待处理
    'PROCESSING',             -- 处理中
    'ACCEPTED',               -- 已受理（创建案件）
    'REJECTED',               -- 已驳回
    'WITHDRAWN',              -- 已撤回
    'VOIDED'                  -- 已作废
);

CREATE TYPE case_status AS ENUM (
    -- ENFORCEMENT 流程
    'CREATED',                -- 案件已创建
    'UNDER_REVIEW',           -- 一审中
    'WAITING_VIDEO',          -- 等待视频认证
    'WAITING_SIGN',           -- 等待签约
    'WAITING_APPROVAL',       -- 等待二审
    'APPROVED',               -- 二审通过
    'ISSUED',                 -- 已发证
    'CLOSED',                 -- 已结案
    'VOIDED',                 -- 已作废
    -- DEPOSIT 流程
    'WAITING_DEPOSIT_CONFIRM',-- 等待存款确认
    'DEPOSITED',              -- 存款已确认
    'NOTICE_PENDING',         -- 通知待发
    'READY_FOR_CLAIM',        -- 可领取
    'CLAIMED'                 -- 已领取
);

CREATE TYPE biz_type AS ENUM (
    'ENFORCEMENT',            -- 强制执行公证
    'DEPOSIT',                -- 存款继承公证
    'PROPERTY',               -- 房产公证
    'WILL',                   -- 遗嘱公证
    'MARRIAGE',               -- 婚姻公证
    'OTHER'                   -- 其他
);

CREATE TYPE material_type AS ENUM (
    'IDENTITY',               -- 身份证
    'HOUSEHOLD',              -- 户口本
    'PROPERTY_CERT',          -- 房产证
    'CERTIFICATE',            -- 证书/证明
    'CONTRACT',               -- 合同
    'VIDEO',                  -- 视频
    'OTHER'                   -- 其他
);

CREATE TYPE review_action_type AS ENUM (
    'SUBMIT',                 -- 提交申请
    'ACCEPT',                 -- 受理
    'REJECT',                 -- 驳回
    'REQUIRE_SUPPLEMENT',      -- 要求补件
    'WITHDRAW',               -- 撤回
    'VOID'                    -- 作废
);

-- ============================================================
-- USERS（用户 - 申请人/群众端）
-- 对应 Java: erp-auth 用户系统，但简化版
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    id_card_no VARCHAR(18),                    -- 身份证号（可选）
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================================
-- STAFF（公证处工作人员）
-- 对应 Java: erp-auth 组织用户体系，简化版
-- ============================================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    role staff_role NOT NULL DEFAULT 'CLERK',
    status staff_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_username ON staff(username);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_status ON staff(status);

-- ============================================================
-- APPLICATIONS（公证申请）
-- 对应 Java: Notarization (notarization 表)
-- 业务主表，记录群众提交的公证申请
-- ============================================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_no VARCHAR(32) UNIQUE NOT NULL,  -- 申请编号 NIxxxxxx
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    biz_type VARCHAR(32) NOT NULL,               -- 业务类型 ENFORCEMENT/DEPOSIT/PROPERTY...
    title VARCHAR(256) NOT NULL,                 -- 申请标题
    description TEXT,                            -- 申请描述/说明
    status application_status NOT NULL DEFAULT 'DRAFT',
    case_id UUID,                               -- 受理后关联的案件ID
    -- 审核信息（对应 Java: firstAuditor/secondAuditor）
    first_auditor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    first_auditor_at TIMESTAMP WITH TIME ZONE,
    second_auditor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    second_auditor_at TIMESTAMP WITH TIME ZONE,
    -- 补件信息
    supplement_reason TEXT,
    -- 附件（JSONB，对应 Java: annexes）
    annexes JSONB DEFAULT '[]',
    -- 扩展参数（JSONB，对应 Java: extend_params）
    extend_params JSONB DEFAULT '{}',
    -- 扩展字段（可存 HTML 表单数据等）
    form_data JSONB DEFAULT '{}',
    -- 业务特定数据（JSONB，可存金额、存款信息等）
    biz_data JSONB DEFAULT '{}',
    -- 驳回原因
    reject_reason TEXT,
    -- 备注
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_applications_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_biz_type ON applications(biz_type);
CREATE INDEX idx_applications_case_id ON applications(case_id);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- ============================================================
-- CASES（公证案件）
-- 对应 Java: 公证案件，关联 application
-- 申请被受理后创建案件
-- ============================================================
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_no VARCHAR(32) UNIQUE NOT NULL,        -- 案件编号
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    biz_type VARCHAR(32) NOT NULL,               -- 业务类型
    title VARCHAR(256) NOT NULL,                 -- 案件标题
    status case_status NOT NULL DEFAULT 'CREATED',
    -- 案件结果/结论
    result TEXT,
    -- 业务数据（JSONB，可存存款金额、签署信息等）
    biz_data JSONB DEFAULT '{}',
    -- 公证书编号（受理后分配）
    certificate_no VARCHAR(64),
    -- 核验码（公证书公开查询用）
    verify_code VARCHAR(16) UNIQUE,
    -- 作废信息
    void_reason TEXT,
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    -- 创建人（受理的工作人员）
    created_by UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    -- 签发信息
    issued_at TIMESTAMP WITH TIME ZONE,
    issued_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    -- 完成时间
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_case_no ON cases(case_no);
CREATE INDEX idx_cases_application_id ON cases(application_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_biz_type ON cases(biz_type);
CREATE INDEX idx_cases_verify_code ON cases(verify_code);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);

-- ============================================================
-- MATERIALS（申请材料/附件）
-- 对应 Java: annexes（JSONB），独立成表便于管理
-- 群众的申请附件
-- ============================================================
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(256) NOT NULL,                  -- 材料名称/标题
    material_type material_type DEFAULT 'OTHER',
    file_name VARCHAR(256) NOT NULL,             -- 原始文件名
    stored_name VARCHAR(256) NOT NULL,           -- 存储文件名（UUID）
    file_path VARCHAR(512) NOT NULL,              -- 存储路径
    file_size BIGINT NOT NULL,                   -- 文件大小（字节）
    file_hash VARCHAR(64),                       -- SHA256 哈希
    mime_type VARCHAR(128),                      -- MIME 类型
    -- 审核状态（null=未审核, true=通过, false=驳回）
    reviewed BOOLEAN,
    review_comment TEXT,
    reviewed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_application_id ON materials(application_id);
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_created_at ON materials(created_at DESC);

-- ============================================================
-- CERTIFICATES（公证书）
-- 对应 Java: 公证书
-- 案件完成后发放
-- ============================================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    certificate_no VARCHAR(64) UNIQUE NOT NULL,  -- 公证书编号
    verify_code VARCHAR(16) UNIQUE NOT NULL,    -- 公开核验码
    pdf_path VARCHAR(512),                       -- PDF 文件路径
    -- 作废
    voided BOOLEAN NOT NULL DEFAULT FALSE,
    void_reason TEXT,
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_certificates_case_id ON certificates(case_id);
CREATE INDEX idx_certificates_certificate_no ON certificates(certificate_no);
CREATE INDEX idx_certificates_verify_code ON certificates(verify_code);

-- ============================================================
-- AUDIT_LOGS（审计日志）
-- 记录所有关键操作
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(64) NOT NULL,            -- USER/STAFF/APPLICATION/CASE/VIDEO_SESSION/CERTIFICATE...
    entity_id UUID NOT NULL,                     -- 被操作的实体ID
    action VARCHAR(64) NOT NULL,                  -- 操作类型 CREATE/UPDATE/DELETE/LOGIN/...
    operator_type VARCHAR(20),                   -- USER/STAFF/SYSTEM
    operator_id UUID,                            -- 操作人ID
    ip_address INET,
    user_agent TEXT,
    detail JSONB DEFAULT '{}',                   -- 详细数据
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_operator ON audit_logs(operator_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- REVIEW_ACTIONS（审批记录）
-- 对应 Java: 审核历史
-- 记录每次审核操作
-- ============================================================
CREATE TABLE review_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    action_type review_action_type NOT NULL,     -- SUBMIT/ACCEPT/REJECT/REQUIRE_SUPPLEMENT/WITHDRAW/VOID
    from_status VARCHAR(32),                     -- 操作前状态
    to_status VARCHAR(32) NOT NULL,              -- 操作后状态
    comment TEXT,                                -- 审批意见/理由
    operator_type VARCHAR(20) NOT NULL,         -- USER/STAFF
    operator_id UUID NOT NULL,                   -- 操作人ID
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_actions_application_id ON review_actions(application_id);
CREATE INDEX idx_review_actions_created_at ON review_actions(created_at DESC);

-- ============================================================
-- ENFORCEMENT_REQUESTS（外部强制执行申请）
-- 对应 Java: 外部系统接入
-- 存储来自外部系统的强制执行公证申请
-- ============================================================
CREATE TABLE enforcement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_no VARCHAR(64) UNIQUE NOT NULL,      -- 外部请求编号
    applicant_name VARCHAR(128) NOT NULL,        -- 申请人姓名
    applicant_id_card VARCHAR(18),                -- 申请人身份证
    applicant_phone VARCHAR(20),                  -- 申请人电话
    applicant_address TEXT,                       -- 申请人地址
    case_description TEXT NOT NULL,              -- 案件描述
    case_amount DECIMAL(18, 2),                  -- 案件金额
    debtor_name VARCHAR(128),                     -- 被执行人姓名
    debtor_id_card VARCHAR(18),                   -- 被执行人身份证
    -- 关联本地申请（创建后可关联）
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED', -- RECEIVED/PROCESSING/COMPLETED/FAILED
    error_message TEXT,
    raw_data JSONB DEFAULT '{}',                  -- 原始请求数据
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enforcement_requests_request_no ON enforcement_requests(request_no);
CREATE INDEX idx_enforcement_requests_status ON enforcement_requests(status);
CREATE INDEX idx_enforcement_requests_application_id ON enforcement_requests(application_id);

-- ============================================================
-- NUMBER_SEQUENCES（编号生成器）
-- 用于生成 application_no, case_no, certificate_no 等业务编号
-- ============================================================
CREATE TABLE number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_name VARCHAR(64) UNIQUE NOT NULL,   -- 编号类型名：application_no/case_no/certificate_no
    prefix VARCHAR(16) NOT NULL,                -- 前缀：NI/AC/CE
    current_value BIGINT NOT NULL DEFAULT 0,
    increment_by INTEGER NOT NULL DEFAULT 1,
    year INTEGER,                                -- 年份（NULL 表示不限年份）
    month INTEGER,                               -- 月份（NULL 表示不限月份）
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT positive_value CHECK (current_value >= 0)
);

-- 初始数据
INSERT INTO number_sequences (sequence_name, prefix, current_value, increment_by) VALUES
    ('application_no', 'NI', 0, 1),
    ('case_no', 'AC', 0, 1),
    ('certificate_no', 'CE', 0, 1);

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE users IS '用户表（申请人/群众端）';
COMMENT ON TABLE staff IS '公证处工作人员表';
COMMENT ON TABLE applications IS '公证申请表';
COMMENT ON TABLE cases IS '公证案件表';
COMMENT ON TABLE materials IS '申请材料附件表';
COMMENT ON TABLE certificates IS '公证书表';
COMMENT ON TABLE audit_logs IS '审计日志表';
COMMENT ON TABLE review_actions IS '审批记录表';
COMMENT ON TABLE enforcement_requests IS '外部强制执行申请表';
COMMENT ON TABLE number_sequences IS '业务编号生成器';
