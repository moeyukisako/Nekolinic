"""add detailed medical record fields

Revision ID: add_detailed_fields
Revises: f39513c6357a
Create Date: 2025-01-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_detailed_fields'
down_revision: Union[str, None] = 'f39513c6357a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add detailed medical record fields."""
    # Add new columns to medical_records table
    op.add_column('medical_records', sa.Column('chief_complaint', sa.Text(), nullable=True))
    op.add_column('medical_records', sa.Column('present_illness', sa.Text(), nullable=True))
    op.add_column('medical_records', sa.Column('past_history', sa.Text(), nullable=True))
    op.add_column('medical_records', sa.Column('temperature', sa.Float(), nullable=True))
    op.add_column('medical_records', sa.Column('pulse', sa.Integer(), nullable=True))
    op.add_column('medical_records', sa.Column('respiratory_rate', sa.Integer(), nullable=True))
    op.add_column('medical_records', sa.Column('blood_pressure', sa.String(20), nullable=True))
    op.add_column('medical_records', sa.Column('physical_examination', sa.Text(), nullable=True))
    op.add_column('medical_records', sa.Column('prescription', sa.Text(), nullable=True))
    
    # Add same columns to medical_records_history table
    op.add_column('medical_records_history', sa.Column('chief_complaint', sa.Text(), nullable=True))
    op.add_column('medical_records_history', sa.Column('present_illness', sa.Text(), nullable=True))
    op.add_column('medical_records_history', sa.Column('past_history', sa.Text(), nullable=True))
    op.add_column('medical_records_history', sa.Column('temperature', sa.Float(), nullable=True))
    op.add_column('medical_records_history', sa.Column('pulse', sa.Integer(), nullable=True))
    op.add_column('medical_records_history', sa.Column('respiratory_rate', sa.Integer(), nullable=True))
    op.add_column('medical_records_history', sa.Column('blood_pressure', sa.String(20), nullable=True))
    op.add_column('medical_records_history', sa.Column('physical_examination', sa.Text(), nullable=True))
    op.add_column('medical_records_history', sa.Column('prescription', sa.Text(), nullable=True))


def downgrade() -> None:
    """Remove detailed medical record fields."""
    # Remove columns from medical_records table
    op.drop_column('medical_records', 'prescription')
    op.drop_column('medical_records', 'physical_examination')
    op.drop_column('medical_records', 'blood_pressure')
    op.drop_column('medical_records', 'respiratory_rate')
    op.drop_column('medical_records', 'pulse')
    op.drop_column('medical_records', 'temperature')
    op.drop_column('medical_records', 'past_history')
    op.drop_column('medical_records', 'present_illness')
    op.drop_column('medical_records', 'chief_complaint')
    
    # Remove columns from medical_records_history table
    op.drop_column('medical_records_history', 'prescription')
    op.drop_column('medical_records_history', 'physical_examination')
    op.drop_column('medical_records_history', 'blood_pressure')
    op.drop_column('medical_records_history', 'respiratory_rate')
    op.drop_column('medical_records_history', 'pulse')
    op.drop_column('medical_records_history', 'temperature')
    op.drop_column('medical_records_history', 'past_history')
    op.drop_column('medical_records_history', 'present_illness')
    op.drop_column('medical_records_history', 'chief_complaint')