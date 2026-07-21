"""Initial schema for exam platform

Revision ID: 8a8d2b8f7a6d
Revises: None
Create Date: 2026-07-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "8a8d2b8f7a6d"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("role", sa.Enum("student", "examiner", "admin", name="userrole"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "question_bank",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("question_type", sa.Enum("mcq", "multi_select", "short_answer", "long_answer", "image_upload", name="questiontype"), nullable=False),
        sa.Column("difficulty", sa.String(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("model_answer", sa.Text(), nullable=True),
        sa.Column("expected_answer", sa.Text(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("marks", sa.Integer(), nullable=False),
        sa.Column("max_marks", sa.Integer(), nullable=True),
        sa.Column("negative_marks", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_question_bank_subject"), "question_bank", ["subject"], unique=False)

    op.create_table(
        "options",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("question_id", sa.String(), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["question_id"], ["question_bank.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "exams",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=False),
        sa.Column("randomize_questions", sa.Boolean(), nullable=True),
        sa.Column("randomization_mode", sa.String(), nullable=True),
        sa.Column("question_selection_rules", sa.JSON(), nullable=True),
        sa.Column("negative_marking_enabled", sa.Boolean(), nullable=True),
        sa.Column("proctoring_enabled", sa.Boolean(), nullable=True),
        sa.Column("webcam_monitoring_enabled", sa.Boolean(), nullable=True),
        sa.Column("gaze_tracking_enabled", sa.Boolean(), nullable=True),
        sa.Column("gaze_tracking_sensitivity_threshold", sa.Integer(), nullable=True),
        sa.Column("max_tab_switch_warnings", sa.Integer(), nullable=True),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "exam_questions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("exam_id", sa.String(), nullable=False),
        sa.Column("question_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["exam_id"], ["exams.id"]),
        sa.ForeignKeyConstraint(["question_id"], ["question_bank.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "exam_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("exam_id", sa.String(), nullable=False),
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("session_token", sa.String(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("auto_submitted", sa.Boolean(), nullable=True),
        sa.Column("suspicion_score", sa.Integer(), nullable=True),
        sa.Column("is_revoked", sa.Boolean(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["exam_id"], ["exams.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_exam_sessions_session_token"), "exam_sessions", ["session_token"], unique=True)

    op.create_table(
        "answers",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("question_id", sa.String(), nullable=False),
        sa.Column("selected_option_ids", sa.JSON(), nullable=True),
        sa.Column("text_answer", sa.Text(), nullable=True),
        sa.Column("image_path", sa.String(), nullable=True),
        sa.Column("ai_score", sa.Integer(), nullable=True),
        sa.Column("ai_justification", sa.Text(), nullable=True),
        sa.Column("final_score", sa.Integer(), nullable=True),
        sa.Column("graded_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["question_id"], ["question_bank.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["exam_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "proctor_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("detail", sa.JSON(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["exam_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("proctor_events")
    op.drop_table("answers")
    op.drop_index(op.f("ix_exam_sessions_session_token"), table_name="exam_sessions")
    op.drop_table("exam_sessions")
    op.drop_table("exam_questions")
    op.drop_table("exams")
    op.drop_table("options")
    op.drop_index(op.f("ix_question_bank_subject"), table_name="question_bank")
    op.drop_table("question_bank")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
