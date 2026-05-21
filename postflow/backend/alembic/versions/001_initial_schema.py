"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
import sqlalchemy as sa
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("platform", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("encrypted_password", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_accounts_id", "accounts", ["id"], unique=False)
    op.create_index("ix_accounts_user_id", "accounts", ["user_id"], unique=False)

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("platform", sa.String(), nullable=False),
        sa.Column("caption", sa.Text(), nullable=False),
        sa.Column("media_path", sa.String(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_posts_id", "posts", ["id"], unique=False)
    op.create_index("ix_posts_user_id", "posts", ["user_id"], unique=False)
    op.create_index("ix_posts_status_scheduled_at", "posts", ["status", "scheduled_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_posts_status_scheduled_at", table_name="posts")
    op.drop_index("ix_posts_user_id", table_name="posts")
    op.drop_index("ix_posts_id", table_name="posts")
    op.drop_table("posts")
    op.drop_index("ix_accounts_user_id", table_name="accounts")
    op.drop_index("ix_accounts_id", table_name="accounts")
    op.drop_table("accounts")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
