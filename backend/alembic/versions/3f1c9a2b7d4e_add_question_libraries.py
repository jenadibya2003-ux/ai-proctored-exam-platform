"""add_question_libraries

Revision ID: 3f1c9a2b7d4e
Revises: 0957461e3896
Create Date: 2026-07-28

"""

from alembic import op
import sqlalchemy as sa

revision = "3f1c9a2b7d4e"
down_revision = "0957461e3896"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "question_libraries",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("purpose", sa.String(), nullable=True),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.add_column(
        "question_bank",
        sa.Column("library_id", sa.String(), sa.ForeignKey("question_libraries.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("question_bank", "library_id")
    op.drop_table("question_libraries")