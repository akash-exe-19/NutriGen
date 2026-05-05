from pydantic import BaseModel
from typing import List
import json
import os
import requests
import io
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from PIL import Image, ImageEnhance
from pyzbar.pyzbar import decode

app = FastAPI()

# --- CORS SETTINGS --
origins = [
    "http://localhost:3000",
    "https://nutri-gen.vercel.app",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE LOADING ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "database.json")

try:
    with open(DATABASE_PATH, "r") as f:
        HEALTH_DATABASE = json.load(f)
except FileNotFoundError:
    HEALTH_DATABASE = {"ingredient_red_flags": {}, "nutrient_limits": {}}

# --- NUTRITIONAL ANALYSIS LOGIC ---
def analyze_product_data(product_json, age=None, gender=None):
    product = product_json.get("product", {})
    recommendations = []
    nutriments = product.get("nutriments", {})
    ingredients_text = product.get("ingredients_text", "") or ""
    ingredients_text_en = product.get("ingredients_text_en", "") or ""
    ingredients_tags = product.get("ingredients_tags", []) or []
    
    tags_text = " ".join([tag.replace("-", " ") for tag in ingredients_tags])
    combined_ingredients = f"{ingredients_text} {ingredients_text_en} {tags_text}".lower()

    # 1. Ingredient Flags
    red_flags = HEALTH_DATABASE.get("ingredient_red_flags", {})
    for ingredient, warning in red_flags.items():
        if ingredient.lower() in combined_ingredients:
            recommendations.append({
                "gene": "Additive Alert",
                "rsid": ingredient,
                "trait": "Food Safety",
                "genotype": "Detected",
                "recommendation": warning
            })

    # 2. Nutrient Table Logic (Formatted for Frontend Summary)
    limits_db = HEALTH_DATABASE.get("nutrient_limits", {})
    
    if age is not None and gender is not None:
        gender_key = gender.lower()
        if gender_key in limits_db:
            age_group = "adults"
            if age < 18:
                age_group = "children"
            elif age > 50:
                age_group = "seniors"
            limits = limits_db[gender_key].get(age_group, limits_db.get("default", {}))
        else:
            limits = limits_db.get("default", {})
    else:
        limits = limits_db.get("default", {})

    for nutrient, rule in limits.items():
        key_100g = f"{nutrient.lower()}_100g"
        value = nutriments.get(key_100g)

        if value is not None:
            # Format rsid as "Nutrient: ValueUnits" for the frontend calculator
            nutrient_label = f"{nutrient.capitalize()}: {round(float(value), 1)}{rule.get('unit', 'g')}"
            
            if "max" in rule and float(value) > rule["max"]:
                recommendations.append({
                    "gene": "Table Alert",
                    "rsid": nutrient_label,
                    "trait": "Nutrient Balance",
                    "genotype": f"High ({round(value, 1)}{rule['unit']})",
                    "recommendation": rule["msg"]
                })
            elif "min" in rule and float(value) >= rule["min"]:
                recommendations.append({
                    "gene": "Nutrition Win",
                    "rsid": nutrient_label,
                    "trait": "Nutrient Balance",
                    "genotype": f"Optimal ({round(value, 1)}{rule['unit']})",
                    "recommendation": rule["msg"]
                })
            else:
                recommendations.append({
                    "gene": "Standard",
                    "rsid": nutrient_label,
                    "trait": "Nutrient Balance",
                    "genotype": f"Normal ({round(value, 1)}{rule['unit']})",
                    "recommendation": "Within limits."
                })
    return recommendations

# --- QUIZ ANALYSIS LOGIC ---
class QuizData(BaseModel):
    goal: str
    symptoms: List[str]

@app.post("/analyze-quiz")
async def analyze_quiz(data: QuizData):
    recommendations = []
    goals_db = HEALTH_DATABASE.get("goal_map", {})
    
    # Check Goal
    if data.goal in goals_db:
        goal_info = goals_db[data.goal]
        recommendations.append({
            "gene": "Goal Strategy",
            "rsid": f"Target: {data.goal}",
            "trait": goal_info.get("trait", "Analysis"),
            "genotype": "Priority",
            "recommendation": goal_info.get("rec", "")
        })

    # Check Symptoms
    symptoms_db = HEALTH_DATABASE.get("symptom_map", {})
    for symptom in data.symptoms:
        if symptom in symptoms_db:
            recommendations.append({
                "gene": "Symptom Support",
                "rsid": symptom,
                "trait": "Dietary Adjustment",
                "genotype": "Detected",
                "recommendation": symptoms_db[symptom]
            })
    return {"status": "success", "data": recommendations}

# --- ENDPOINTS ---

@app.get("/")
async def health_check():
    return {"status": "online", "message": "NutriGen Backend Live"}

@app.get("/scan-barcode/{barcode}")
async def scan_barcode(barcode: str, age: int = None, gender: str = None):
    headers = {'User-Agent': 'NutriGen - StudentProject - 1.0'}
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        if data.get("status") == 0:
            return {"status": "error", "message": "Product not found."}

        product = data.get("product", {})
        product_name = product.get("product_name", "Unknown Product")
        analysis = analyze_product_data(data, age, gender)

        return {"status": "success", "product_name": product_name, "data": analysis}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/upload-barcode-photo")
async def upload_barcode_photo(file: UploadFile = File(...), age: int = Form(None), gender: str = Form(None)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    detected = decode(image)
    if not detected:
        # Try grayscale
        gray = image.convert('L')
        detected = decode(gray)
    if not detected:
        # Try higher contrast
        enhancer = ImageEnhance.Contrast(gray)
        contrast = enhancer.enhance(2.0)
        detected = decode(contrast)
    if not detected:
        # Try rotating
        detected = decode(image.rotate(90, expand=True))
        
    if not detected:
        return {"status": "error", "message": "No barcode detected. Please try a clearer image."}
        
    return await scan_barcode(detected[0].data.decode("utf-8"), age, gender)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)