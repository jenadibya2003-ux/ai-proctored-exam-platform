"""merge heads

Revision ID: 816a0955d5f6
Revises: 0cb4f462b237, 3f1c9a2b7d4e
Create Date: 2026-07-28 16:16:05.289012

"""
from alembic import op
import sqlalchemy as sa


revision = '816a0955d5f6'
down_revision = ('0cb4f462b237', '3f1c9a2b7d4e')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
