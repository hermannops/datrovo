"""lead type split: achat vs reprise

Revision ID: 3bb4e2936811
Revises: 74dbe20632e9
Create Date: 2026-10-03 07:23:30.073341

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3bb4e2936811'
down_revision: Union[str, None] = '74dbe20632e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Contrairement à CREATE TABLE, un ALTER TABLE ADD COLUMN ne crée pas le
    # type Postgres implicitement : il faut l'émettre nous-mêmes avant.
    lead_type_enum = postgresql.ENUM('ACHAT', 'REPRISE', name='leadtype')
    lead_type_enum.create(op.get_bind(), checkfirst=True)

    # lead_type d'abord nullable : impossible d'ajouter une colonne NOT NULL
    # sans défaut sur une table qui a déjà des lignes (4 leads de dev
    # existants). On la verrouille en NOT NULL après le backfill ci-dessous.
    op.add_column('leads', sa.Column('lead_type', lead_type_enum, nullable=True))
    op.add_column('leads', sa.Column('vehicle_id', sa.Integer(), nullable=True))
    op.add_column('leads', sa.Column('client_plate', sa.String(length=15), nullable=True))
    op.add_column('leads', sa.Column('client_vehicle_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.alter_column('leads', 'vehicle_brand',
               existing_type=sa.VARCHAR(length=60),
               nullable=True)
    op.alter_column('leads', 'vehicle_model',
               existing_type=sa.VARCHAR(length=60),
               nullable=True)

    # --- Backfill des lignes existantes (données Bloc 1-3) ---
    # Par défaut, tout lead déjà en base est un lead "achat" : c'était le
    # seul type modélisé avant cette migration.
    op.execute("UPDATE leads SET lead_type = 'ACHAT'")
    # Le lead créé via l'ancien stopgap frontend (vehicle_brand = 'À
    # identifier (reprise)', plaque stockée dans vehicle_model) était en
    # réalité une reprise : on migre ses données vers les colonnes dédiées
    # plutôt que de le laisser classé "achat".
    op.execute(
        """
        UPDATE leads
        SET lead_type = 'REPRISE',
            client_plate = vehicle_model,
            vehicle_brand = NULL,
            vehicle_model = NULL
        WHERE vehicle_brand = 'À identifier (reprise)'
        """
    )

    op.alter_column('leads', 'lead_type', nullable=False)

    op.create_index('ix_leads_phone_plate', 'leads', ['phone', 'client_plate'], unique=False)
    op.create_index(op.f('ix_leads_vehicle_id'), 'leads', ['vehicle_id'], unique=False)
    op.create_foreign_key(
        'fk_leads_vehicle_id_vehicles', 'leads', 'vehicles', ['vehicle_id'], ['id'], ondelete='SET NULL'
    )
    op.create_check_constraint(
        'ck_leads_type_consistency',
        'leads',
        "(lead_type = 'ACHAT' AND vehicle_brand IS NOT NULL AND vehicle_model IS NOT NULL) "
        "OR (lead_type = 'REPRISE' AND client_plate IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint('ck_leads_type_consistency', 'leads', type_='check')
    op.drop_constraint('fk_leads_vehicle_id_vehicles', 'leads', type_='foreignkey')
    op.drop_index(op.f('ix_leads_vehicle_id'), table_name='leads')
    op.drop_index('ix_leads_phone_plate', table_name='leads')

    # Remonte les reprises migrées vers l'ancien schéma (perte des infos
    # reprise-spécifiques : c'est une downgrade, pas une opération sans
    # perte) avant de revalider les colonnes en NOT NULL.
    op.execute(
        """
        UPDATE leads
        SET vehicle_brand = 'À identifier (reprise)',
            vehicle_model = client_plate
        WHERE lead_type = 'REPRISE'
        """
    )

    op.alter_column('leads', 'vehicle_model',
               existing_type=sa.VARCHAR(length=60),
               nullable=False)
    op.alter_column('leads', 'vehicle_brand',
               existing_type=sa.VARCHAR(length=60),
               nullable=False)
    op.drop_column('leads', 'client_vehicle_details')
    op.drop_column('leads', 'client_plate')
    op.drop_column('leads', 'vehicle_id')
    op.drop_column('leads', 'lead_type')
    op.execute("DROP TYPE IF EXISTS leadtype")
