"""make leads.created_at timezone-aware

Revision ID: 9cee4fc553e3
Revises: 40f4bff090ad
Create Date: 2026-10-03 06:24:14.420652

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9cee4fc553e3'
down_revision: Union[str, None] = '40f4bff090ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Le defaut d'origine ('now()' passe comme string Python, pas comme
    # fonction SQL) a ete figé par Postgres comme un timestamp constant au
    # moment du CREATE TABLE au lieu d'etre reevalue a chaque insert. On
    # corrige le type (TIMESTAMPTZ) ET le server_default (fonction now()
    # reelle, via sa.text) dans la meme operation.
    op.alter_column('leads', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               server_default=sa.text('now()'),
               existing_nullable=False)


def downgrade() -> None:
    op.alter_column('leads', 'created_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               server_default=sa.text('now()'),
               existing_nullable=False)
