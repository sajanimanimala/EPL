from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile
import json
import urllib.request
import urllib.error

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = WhisperModel("base")

GEMINI_API_KEY = "AIzaSyApOKoMjQMdIZ4-aR6jxp56tiuBA8VgvH4"


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
        temp.write(await file.read())
        temp_path = temp.name
    segments, _ = model.transcribe(temp_path)
    text = " ".join([segment.text for segment in segments])
    return {"text": text.lower()}


@app.get("/research/search")
async def research_search(q: str):
    try:
        prompt = (
            f'Give me exactly 2 recent real research papers about "{q}". '
            f'Return ONLY a JSON array, no markdown, no explanation, no code fences. '
            f'Each object must have these keys: '
            f'"title" (string), "authors" (string), "year" (string), "journal" (string), '
            f'"abstract" (5 sentences), "introduction" (6 sentences), "conclusion" (5 sentences). '
            f'Example format: [{{"title":"...","authors":"...","year":"2024","journal":"...","abstract":"...","introduction":"...","conclusion":"..."}}]'
        )

        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096
            }
        }).encode("utf-8")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        raw = result["candidates"][0]["content"]["parts"][0]["text"].strip()

        # Strip any markdown fences if Gemini adds them
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        # Find the JSON array inside the response
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError(f"No JSON array found in Gemini response: {raw[:300]}")

        papers_raw = json.loads(raw[start:end])

        results = []
        for i, p in enumerate(papers_raw[:2]):
            results.append({
                "id": i + 1,
                "title": p.get("title", "Untitled"),
                "authors": p.get("authors", "Unknown"),
                "year": str(p.get("year", "2024")),
                "journal": p.get("journal", "Unknown Journal"),
                "abstract": p.get("abstract", "Abstract not available."),
                "introduction": p.get("introduction", "Introduction not available."),
                "conclusion": p.get("conclusion", "Conclusion not available."),
            })

        return {"results": results}

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print("GEMINI HTTP ERROR:", e.code, body)
        raise HTTPException(status_code=500, detail=f"Gemini API error {e.code}: {body}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

