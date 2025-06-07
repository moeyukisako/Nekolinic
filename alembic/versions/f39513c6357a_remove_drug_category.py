"""remove_drug_category

Revision ID: f39513c6357a
Revises: 5d2bee020431
Create Date: 2025-06-07 21:05:13.251772

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f39513c6357a'
down_revision: Union[str, None] = '5d2bee020431'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove foreign key constraint from drugs table
    op.drop_constraint('drugs_category_id_fkey', 'drugs', type_='foreignkey')
    
    # Remove category_id column from drugs table
    op.drop_column('drugs', 'category_id')
    
    # Remove category_id from drugs_history table
    op.drop_column('drugs_history', 'category_id')
    
    # Drop drug_categories_history table
    op.drop_index(op.f('ix_drug_categories_history_id'), table_name='drug_categories_history')
    op.drop_index(op.f('ix_drug_categories_history_history_id'), table_name='drug_categories_history')
    op.drop_table('drug_categories_history')
    
    # Drop drug_categories table
    op.drop_index(op.f('ix_drug_categories_id'), table_name='drug_categories')
    op.drop_table('drug_categories')


def downgrade() -> None:
    """Downgrade schema."""
    # Recreate drug_categories table
    op.create_table('drug_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_drug_categories_id'), 'drug_categories', ['id'], unique=False)
    
    # Recreate drug_categories_history table
    op.create_table('drug_categories_history',
        sa.Column('history_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.String(length=10), nullable=False),
        sa.Column('action_timestamp', sa.DateTime(), nullable=False),
        sa.Column('action_by_id', sa.Integer(), nullable=True),
        sa.Column('id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['action_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('history_id')
    )
    op.create_index(op.f('ix_drug_categories_history_history_id'), 'drug_categories_history', ['history_id'], unique=False)
    op.create_index(op.f('ix_drug_categories_history_id'), 'drug_categories_history', ['id'], unique=False)
    
    # Add category_id back to drugs_history table
    op.add_column('drugs_history', sa.Column('category_id', sa.Integer(), nullable=True))
    
    # Add category_id back to drugs table
    op.add_column('drugs', sa.Column('category_id', sa.Integer(), nullable=True))
    
    # Recreate foreign key constraint
    op.create_foreign_key('drugs_category_id_fkey', 'drugs', 'drug_categories', ['category_id'], ['id'])
