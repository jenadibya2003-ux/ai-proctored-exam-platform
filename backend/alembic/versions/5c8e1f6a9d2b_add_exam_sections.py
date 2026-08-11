"""add_exam_sections

Revision ID: 5c8e1f6a9d2b
Revises: 9a2d5e7c1f30
Create Date: 2026-07-31

"""

from alembic import op
import sqlalchemy as sa

revision = "5c8e1f6a9d2b"
down_revision = "9a2d5e7c1f30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "exam_sections",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("exam_id", sa.String(), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column(
            "library_id", sa.String(), sa.ForeignKey("question_libraries.id"), nullable=True
        ),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("section_order", sa.Integer(), nullable=True),
        sa.Column("question_limit", sa.Integer(), nullable=True),
        sa.Column("total_marks", sa.Integer(), nullable=True),
        sa.Column("negative_marks", sa.Integer(), nullable=True),
        sa.Column("randomize_questions", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.add_column(
        "exam_questions",
        sa.Column("section_id", sa.String(), sa.ForeignKey("exam_sections.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("exam_questions", "section_id")
    op.drop_table("exam_sections")