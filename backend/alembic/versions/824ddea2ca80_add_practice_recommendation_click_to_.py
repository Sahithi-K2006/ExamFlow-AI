"""add practice_recommendation_click to activityeventtype

Revision ID: 824ddea2ca80
Revises: 9d2956879ac3
Create Date: 2026-07-11 15:25:39.251832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '824ddea2ca80'
down_revision: Union[str, None] = '9d2956879ac3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_VALUES = (
    'opened_link', 'login', 'start_exam_click', 'queue_entry', 'queue_exit',
    'exam_start', 'submission', 'logout', 'browser_refresh', 'disconnect', 'reconnect',
)
NEW_VALUES = OLD_VALUES + ('practice_recommendation_click',)


def upgrade() -> None:
    # MySQL (current dev DB): MODIFY COLUMN with the expanded ENUM value list.
    # NOTE for the future Supabase/Postgres cutover: Postgres enums can't be widened via
    # alter_column like this — that environment would instead run
    # `ALTER TYPE activityeventtype ADD VALUE 'practice_recommendation_click'` (Postgres 12+,
    # must run outside an explicit transaction block).
    op.alter_column(
        'activity_log', 'event_type',
        existing_type=sa.Enum(*OLD_VALUES, name='activityeventtype'),
        type_=sa.Enum(*NEW_VALUES, name='activityeventtype'),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'activity_log', 'event_type',
        existing_type=sa.Enum(*NEW_VALUES, name='activityeventtype'),
        type_=sa.Enum(*OLD_VALUES, name='activityeventtype'),
        existing_nullable=False,
    )
