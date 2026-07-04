CREATE TABLE IF NOT EXISTS iam_user_role (
    user_id VARCHAR(64) NOT NULL,
    role_id VARCHAR(64) NOT NULL,
    application_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_iam_user_role_application_id
    ON iam_user_role (application_id);
CREATE INDEX IF NOT EXISTS idx_iam_user_role_role_id
    ON iam_user_role (role_id);
