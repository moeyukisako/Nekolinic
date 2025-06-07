"""remove_drug_category

Revision ID: 5d2bee020431
Revises: 1acdc3cce2d5
Create Date: 2025-06-07 21:03:04.665027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d2bee020431'
down_revision: Union[str, None] = '1acdc3cce2d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
