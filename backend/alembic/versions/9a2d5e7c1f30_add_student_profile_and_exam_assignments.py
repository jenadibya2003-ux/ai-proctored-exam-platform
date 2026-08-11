"""add_student_profile_and_exam_assignments

Revision ID: 9a2d5e7c1f30
Revises: 816a0955d5f6
Create Date: 2026-07-29

"""

from alembic import op
import sqlalchemy as sa

revision = "9a2d5e7c1f30"
down_revision = "816a0955d5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("roll_number", sa.String(), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(), nullable=True))
    op.add_column("users", sa.Column("semester", sa.String(), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("account_status", sa.String(), nullable=False, server_default="approved"),
    )

    op.create_table(
        "exam_assignments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("exam_id", sa.String(), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("student_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("exam_assignments")
    op.drop_column("users", "account_status")
    op.drop_column("users", "phone")
    op.drop_column("users", "semester")
    op.drop_column("users", "department")
    op.drop_column("users", "roll_number")