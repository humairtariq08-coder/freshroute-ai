"""SQLite marketplace with explicitly labeled demo seed records."""
from contextlib import closing
from datetime import date, timedelta
import sqlite3
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/api")


class ProductInput(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=80)
    category: Literal["Vegetables", "Fruits", "Leafy greens", "Grains"] = "Vegetables"
    farmer: str = Field(default="Local grower", min_length=2, max_length=80)
    location: str = Field(default="Karachi", min_length=2, max_length=80)
    price: float = Field(gt=0, le=1000000)
    quantity: float = Field(gt=0, le=1000000)
    unit: Literal["kg"] = "kg"
    freshness_days: int = Field(default=3, ge=1, le=365)
    image: str = Field(default="", max_length=1000)
    lat: float = Field(default=24.8607, ge=-90, le=90)
    lng: float = Field(default=67.0011, ge=-180, le=180)
    description: str = Field(default="", max_length=2000)


class RequirementInput(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, str_strip_whitespace=True)
    buyer: str = Field(min_length=2, max_length=80)
    produce: str = Field(min_length=2, max_length=80)
    quantity: float = Field(gt=0, le=1000000)
    max_price: float = Field(gt=0, le=1000000)
    location: str = Field(default="Karachi", min_length=2, max_length=80)


class OrderInput(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, str_strip_whitespace=True)
    product_id: int = Field(gt=0)
    quantity: float = Field(gt=0, le=1000000)
    buyer: str = Field(min_length=2, max_length=80)


def connect(path):
    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize(path):
    with closing(connect(path)) as db, db:
        db.executescript('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
                farmer TEXT NOT NULL, location TEXT NOT NULL, price REAL NOT NULL,
                quantity REAL NOT NULL CHECK(quantity >= 0), unit TEXT NOT NULL,
                freshness_days INTEGER NOT NULL, image TEXT NOT NULL,
                lat REAL NOT NULL, lng REAL NOT NULL, description TEXT NOT NULL,
                demo INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS requirements (
                id INTEGER PRIMARY KEY, buyer TEXT NOT NULL, produce TEXT NOT NULL,
                quantity REAL NOT NULL, max_price REAL NOT NULL, location TEXT NOT NULL,
                demo INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id),
                product_name TEXT NOT NULL, farmer TEXT NOT NULL, buyer TEXT NOT NULL,
                quantity REAL NOT NULL, price REAL NOT NULL, total REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'Reserved',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, demo INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS demand_history (
                date TEXT PRIMARY KEY, demand REAL NOT NULL, supply REAL NOT NULL,
                demo INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS marketplace_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        ''')
        if db.execute("SELECT 1 FROM marketplace_meta WHERE key='seed_v1'").fetchone():
            return
        seeds = [
            ("Vine tomatoes", "Vegetables", "Ahmed Family Farm", "Malir, Karachi", 140, 480, 4, "tomatoes", 24.943, 67.208),
            ("Fresh spinach", "Leafy greens", "Green Valley Growers", "Gadap, Karachi", 90, 180, 2, "spinach", 25.032, 67.135),
            ("Sindhri mangoes", "Fruits", "Mehran Orchards", "Mirpur Khas", 280, 650, 5, "mango", 25.527, 69.012),
            ("Golden potatoes", "Vegetables", "Indus Harvest", "Hyderabad", 75, 1200, 14, "potatoes", 25.397, 68.377),
            ("Red onions", "Vegetables", "Ahmed Family Farm", "Malir, Karachi", 110, 900, 21, "onions", 24.943, 67.208),
            ("Sweet carrots", "Vegetables", "Green Valley Growers", "Gadap, Karachi", 120, 350, 7, "carrots", 25.032, 67.135),
            ("Green cucumbers", "Vegetables", "Coastal Greens", "Thatta", 100, 260, 4, "cucumber", 24.747, 67.924),
            ("Fresh bananas", "Fruits", "Mehran Orchards", "Tando Allahyar", 160, 420, 4, "bananas", 25.461, 68.716),
            ("Green capsicum", "Vegetables", "Coastal Greens", "Thatta", 190, 220, 5, "peppers", 24.747, 67.924),
            ("Fresh coriander", "Leafy greens", "Green Valley Growers", "Gadap, Karachi", 180, 90, 2, "herbs", 25.032, 67.135),
            ("Basmati rice", "Grains", "Indus Harvest", "Hyderabad", 320, 1800, 120, "rice", 25.397, 68.377),
            ("Sweet oranges", "Fruits", "Punjab Citrus Co-op", "Sargodha", 200, 540, 10, "oranges", 32.083, 72.671),
        ]
        for name, category, farmer, location, price, quantity, days, image, lat, lng in seeds:
            db.execute("INSERT INTO products (name,category,farmer,location,price,quantity,unit,freshness_days,image,lat,lng,description,demo) VALUES (?,?,?,?,?,?,'kg',?,?,?,?,?,1)",
                       (name, category, farmer, location, price, quantity, days, image, lat, lng,
                        f"Illustrative {name.lower()} listing for the FreshRoute demo. Availability, grower and price are sample data."))
        for row in [("City Fresh Market", "tomatoes", 200, 160, "Clifton, Karachi"), ("Harvest Kitchen", "spinach", 80, 110, "DHA, Karachi"), ("Metro Grocers", "potatoes", 500, 90, "Saddar, Karachi"), ("Daily Basket", "mangoes", 300, 310, "Gulshan, Karachi")]:
            db.execute("INSERT INTO requirements (buyer,produce,quantity,max_price,location,demo) VALUES (?,?,?,?,?,1)", row)
        for index, (demand, supply) in enumerate([(420, 580), (510, 620), (460, 560), (640, 710), (590, 650), (720, 810), (680, 760)]):
            day = (date.today() - timedelta(days=6-index)).isoformat()
            db.execute("INSERT OR IGNORE INTO demand_history(date,demand,supply) VALUES (?,?,?)", (day, demand, supply))
        db.execute("INSERT INTO marketplace_meta VALUES ('seed_v1', 'complete')")


def records(db, table):
    return [dict(row) for row in db.execute(f"SELECT * FROM {table} ORDER BY " + ("date" if table == "demand_history" else "id DESC"))]


@router.get("/marketplace")
def marketplace(request: Request):
    with closing(connect(request.app.state.database_path)) as db:
        products = records(db, "products")
        requirements = records(db, "requirements")
        orders = records(db, "orders")
        history = records(db, "demand_history")
    average = round(sum(row["demand"] for row in history[-7:]) / max(1, len(history[-7:])), 1)
    return {"products": products, "requirements": requirements, "orders": orders, "history": history,
            "summary": {"available_kg": round(sum(p["quantity"] for p in products), 1),
                        "active_listings": sum(p["quantity"] > 0 for p in products),
                        "farmers": len({p["farmer"] for p in products}),
                        "open_demand_kg": sum(r["quantity"] for r in requirements),
                        "order_value": round(sum(o["total"] for o in orders), 2),
                        "forecast_kg": average, "forecast_method": "7-day arithmetic mean of demo demand history; illustrative baseline, not a trained model.",
                        "demo": True}}


@router.get("/products")
def products(request: Request):
    with closing(connect(request.app.state.database_path)) as db:
        return records(db, "products")


@router.post("/products", status_code=201)
def create_product(value: ProductInput, request: Request):
    fields = value.model_dump()
    with closing(connect(request.app.state.database_path)) as db, db:
        cursor = db.execute(f"INSERT INTO products ({','.join(fields)}) VALUES ({','.join('?' for _ in fields)})", list(fields.values()))
        return dict(db.execute("SELECT * FROM products WHERE id=?", (cursor.lastrowid,)).fetchone())


@router.get("/requirements")
def requirements(request: Request):
    with closing(connect(request.app.state.database_path)) as db:
        return records(db, "requirements")


@router.post("/requirements", status_code=201)
def create_requirement(value: RequirementInput, request: Request):
    fields = value.model_dump()
    with closing(connect(request.app.state.database_path)) as db, db:
        cursor = db.execute(f"INSERT INTO requirements ({','.join(fields)}) VALUES ({','.join('?' for _ in fields)})", list(fields.values()))
        return dict(db.execute("SELECT * FROM requirements WHERE id=?", (cursor.lastrowid,)).fetchone())


@router.get("/orders")
def orders(request: Request):
    with closing(connect(request.app.state.database_path)) as db:
        return records(db, "orders")


@router.post("/orders", status_code=201)
def create_order(value: OrderInput, request: Request):
    with closing(connect(request.app.state.database_path)) as db, db:
        db.execute("BEGIN IMMEDIATE")
        product = db.execute("SELECT * FROM products WHERE id=?", (value.product_id,)).fetchone()
        if product is None:
            raise HTTPException(404, "Product not found.")
        changed = db.execute("UPDATE products SET quantity=quantity-? WHERE id=? AND quantity>=?", (value.quantity, value.product_id, value.quantity)).rowcount
        if not changed:
            raise HTTPException(409, "Not enough stock. Refresh the listing and reduce the quantity.")
        cursor = db.execute("INSERT INTO orders (product_id,product_name,farmer,buyer,quantity,price,total,demo) VALUES (?,?,?,?,?,?,?,?)",
                            (product["id"], product["name"], product["farmer"], value.buyer, value.quantity, product["price"], round(value.quantity*product["price"], 2), product["demo"]))
        return dict(db.execute("SELECT * FROM orders WHERE id=?", (cursor.lastrowid,)).fetchone())


@router.get("/matches")
def matches(request: Request):
    with closing(connect(request.app.state.database_path)) as db:
        products, requirements = records(db, "products"), records(db, "requirements")
    results = []
    for requirement in requirements:
        for product in products:
            if requirement["produce"].casefold() not in product["name"].casefold() or product["price"] > requirement["max_price"] or product["quantity"] <= 0:
                continue
            quantity = min(product["quantity"], requirement["quantity"])
            results.append({"product": product, "requirement": requirement, "quantity": quantity,
                            "score": round(quantity / requirement["quantity"] * 100),
                            "savings": round((requirement["max_price"]-product["price"])*quantity, 2),
                            "reason": "Produce name matches, price is within budget; score is available quantity as a percentage of requested quantity.",
                            "method": "Deterministic stock and price matching; not AI", "demo": bool(product["demo"] or requirement["demo"])})
    return sorted(results, key=lambda item: (-item["score"], item["product"]["price"]))
