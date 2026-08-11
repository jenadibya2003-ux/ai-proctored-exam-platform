"""add_mock_exam_tables

Revision ID: 7b3f4a8e2c91
Revises: 5c8e1f6a9d2b
Create Date: 2026-08-01

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "7b3f4a8e2c91"
down_revision = "5c8e1f6a9d2b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    questiontype_enum = postgresql.ENUM(
        "mcq", "multi_select", "short_answer", "long_answer", "image_upload",
        name="questiontype",
        create_type=False,
    )

    op.create_table(
        "mock_exam_config",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("guidelines", sa.Text(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("camera_required", sa.Boolean(), nullable=True),
        sa.Column("microphone_required", sa.Boolean(), nullable=True),
        sa.Column("fullscreen_required", sa.Boolean(), nullable=True),
        sa.Column("face_detection_required", sa.Boolean(), nullable=True),
        sa.Column("max_tab_switch_warnings", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "mock_questions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("question_type", questiontype_enum, nullable=False, unique=True),
        sa.Column("difficulty", sa.String(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("marks", sa.Integer(), nullable=True),
        sa.Column("options", sa.JSON(), nullable=True),
        sa.Column("model_answer", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("mock_questions")
    op.drop_table("mock_exam_config")