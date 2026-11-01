"""Initial portable marketplace schema."""
from alembic import op
import sqlalchemy as sa

revision = "0001_marketplace"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("products", sa.Column("id", sa.Integer, primary_key=True), sa.Column("name", sa.Text, nullable=False), sa.Column("category", sa.Text, nullable=False), sa.Column("farmer", sa.Text, nullable=False), sa.Column("location", sa.Text, nullable=False), sa.Column("price", sa.Float, nullable=False), sa.Column("quantity", sa.Float, nullable=False), sa.Column("unit", sa.Text, nullable=False), sa.Column("freshness_days", sa.Integer, nullable=False), sa.Column("image", sa.Text, nullable=False), sa.Column("lat", sa.Float, nullable=False), sa.Column("lng", sa.Float, nullable=False), sa.Column("description", sa.Text, nullable=False), sa.Column("demo", sa.Integer, nullable=False, server_default="0"), sa.CheckConstraint("quantity >= 0"))
    op.create_table("requirements", sa.Column("id", sa.Integer, primary_key=True), sa.Column("buyer", sa.Text, nullable=False), sa.Column("produce", sa.Text, nullable=False), sa.Column("quantity", sa.Float, nullable=False), sa.Column("max_price", sa.Float, nullable=False), sa.Column("location", sa.Text, nullable=False), sa.Column("lat", sa.Float), sa.Column("lng", sa.Float), sa.Column("demo", sa.Integer, nullable=False, server_default="0"))
    op.create_table("orders", sa.Column("id", sa.Integer, primary_key=True), sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False), sa.Column("product_name", sa.Text, nullable=False), sa.Column("farmer", sa.Text, nullable=False), sa.Column("buyer", sa.Text, nullable=False), sa.Column("quantity", sa.Float, nullable=False), sa.Column("price", sa.Float, nullable=False), sa.Column("total", sa.Float, nullable=False), sa.Column("status", sa.Text, nullable=False, server_default="Reserved"), sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()), sa.Column("demo", sa.Integer, nullable=False))
    op.create_table("demand_history", sa.Column("date", sa.Text, primary_key=True), sa.Column("demand", sa.Float, nullable=False), sa.Column("supply", sa.Float, nullable=False), sa.Column("demo", sa.Integer, nullable=False, server_default="1"))
    op.create_table("marketplace_meta", sa.Column("key", sa.Text, primary_key=True), sa.Column("value", sa.Text, nullable=False))

def downgrade():
    for table in ("marketplace_meta", "demand_history", "orders", "requirements", "products"):
        op.drop_table(table)
