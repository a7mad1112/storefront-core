import os
import sys
import dotenv
from supabase import create_client

# Add scraper dir to path to import generate_slug
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "scraper"))
from db import generate_slug

dotenv.load_dotenv(".env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
sb = create_client(url, key)

print("Updating categories...")
cats = sb.table("categories").select("id, name, supplier_id, slug").execute().data
for c in cats:
    new_slug = generate_slug(c["name"], c["supplier_id"], prefix="cat")
    if new_slug != c["slug"]:
        sb.table("categories").update({"slug": new_slug}).eq("id", c["id"]).execute()
        print(f"Updated category {c['supplier_id']}: {c['slug']} -> {new_slug}")

print("Updating products...")
offset = 0
count = 0
while True:
    prods = sb.table("products").select("id, name, supplier_id, slug").range(offset, offset + 999).execute().data
    if not prods:
        break
    for p in prods:
        new_slug = generate_slug(p["name"], p["supplier_id"], prefix="product")
        if new_slug != p["slug"]:
            sb.table("products").update({"slug": new_slug}).eq("id", p["id"]).execute()
            count += 1
    offset += 1000
print(f"Updated {count} products across all batches to clean ASCII slugs.")
print("DONE!")
