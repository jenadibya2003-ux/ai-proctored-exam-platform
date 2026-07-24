"""add_exam_fields

Revision ID: 0957461e3896
Revises: 8a8d2b8f7a6d
Create Date: 2026-07-20

"""

from alembic import op
import sqlalchemy as sa

revision = "0957461e3896"
down_revision = "8a8d2b8f7a6d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "exams",
        sa.Column("total_marks", sa.Integer(), nullable=False, server_default="100"),
    )

    op.add_column(
        "exams",
        sa.Column("passing_marks", sa.Integer(), nullable=False, server_default="40"),
    )

    op.add_column(
        "exams",
        sa.Column("status", sa.String(), nullable=False, server_default="Draft"),
    )


def downgrade() -> None:
    op.drop_column("exams", "status")
    op.drop_column("exams", "passing_marks")
    op.drop_column("exams", "total_marks")