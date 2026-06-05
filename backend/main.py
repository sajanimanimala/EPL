from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import os
import tempfile
import json
import urllib.parse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from html import unescape

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = WhisperModel("base")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

FALLBACK_PAPERS = [
    {
        "id": 1,
        "title": "Recent Advances in Machine Learning for Natural Language Processing",
        "authors": "A. Patel, M. Chen",
        "year": "2024",
        "journal": "Proceedings of the International AI Conference",
        "abstract": "This paper surveys recent machine learning methods for natural language processing, focusing on transformer-based models and efficient training techniques. It evaluates performance on text classification and question answering benchmarks. The study concludes with recommendations for future research in low-resource NLP.",
        "introduction": "Natural language processing has rapidly advanced thanks to modern machine learning methods. This paper reviews the latest transformer architectures and training approaches. It explains why these developments are important for building more accurate language systems. The introduction highlights challenges in generalization and computational cost.",
        "conclusion": "The study finds that transformer-based methods continue to lead NLP progress, especially when combined with efficient fine-tuning. It recommends more work on model compression and robustness. Future research should focus on making large language models accessible to smaller organizations.",
    },
    {
        "id": 2,
        "title": "A Survey of Explainable AI in Computer Vision Applications",
        "authors": "L. Roberts, N. Singh",
        "year": "2023",
        "journal": "Journal of Computer Vision Research",
        "abstract": "This survey examines explainable AI techniques for computer vision, including saliency maps, attention visualization, and concept-based explanations. It compares methods across object detection and image classification tasks. The paper highlights open problems in model transparency and human interpretability.",
        "introduction": "Explainable AI aims to make machine vision models more transparent to users and developers. This paper introduces the key methods used to interpret deep convolutional networks. It argues that explainability is critical for deploying vision systems in safety-sensitive domains. The introduction reviews the state of the art in visual explanation.",
        "conclusion": "The survey concludes that explainability techniques have matured, but challenges remain in evaluation and consistency. It suggests future work on standardizing explanation benchmarks. The paper recommends integrating human feedback into explanation methods for better trust.",
    },
]


def search_arxiv(query: str, max_results: int = 2):
    try:
        uri = urllib.parse.quote(query)
        url = (
            f"https://export.arxiv.org/api/query?"
            f"search_query=all:{uri}&start=0&max_results={max_results}&"
            f"sortBy=submittedDate&sortOrder=descending"
        )
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "EPL ResearchMode/1.0",
                "Accept": "application/xml",
            },
        )
        with urllib.request.urlopen(request, timeout=20) as resp:
            body = resp.read().decode("utf-8")

        root = ET.fromstring(body)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = []
        for entry in root.findall("atom:entry", ns):
            title = unescape((entry.find("atom:title", ns).text or "").strip()).replace("\n", " ")
            summary = unescape((entry.find("atom:summary", ns).text or "").strip()).replace("\n", " ")
            published = (entry.find("atom:published", ns).text or "").strip()
            year = published[:4] if published else ""
            authors = ", ".join(
                [
                    a.find("atom:name", ns).text.strip()
                    for a in entry.findall("atom:author", ns)
                    if a.find("atom:name", ns) is not None
                ]
            )
            sentences = [s.strip() for s in summary.split(".") if s.strip()]
            introduction = " ".join(sentences[:2]) + ("." if len(sentences) >= 2 else "")
            conclusion = " ".join(sentences[-2:]) + ("." if len(sentences) >= 2 else "")
            entries.append({
                "id": len(entries) + 1,
                "title": title,
                "authors": authors or "Unknown",
                "year": year or "2024",
                "journal": "arXiv",
                "abstract": summary,
                "introduction": introduction or summary,
                "conclusion": conclusion or summary,
            })
            if len(entries) >= max_results:
                break
        return entries
    except Exception as e:
        print("arXiv search error:", e)
        return []


def search_semantic_scholar(query: str, max_results: int = 2):
    try:
        uri = urllib.parse.quote(query)
        url = (
            f"https://api.semanticscholar.org/graph/v1/paper/search?"
            f"query={uri}&limit={max_results}&fields=title,authors,year,venue,abstract"
        )
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "EPL ResearchMode/1.0",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(request, timeout=20) as resp:
            body = resp.read().decode("utf-8")

        result = json.loads(body)
        data = result.get("data", [])
        entries = []
        for paper in data:
            title = (paper.get("title") or "").strip()
            authors = ", ".join(
                [
                    a.get("name", "").strip()
                    for a in paper.get("authors", [])
                    if a.get("name")
                ]
            )
            abstract = (paper.get("abstract") or "").strip()
            year = str(paper.get("year")) if paper.get("year") else ""
            venue = paper.get("venue") or "Semantic Scholar"
            sentences = [s.strip() for s in abstract.split(".") if s.strip()]
            introduction = " ".join(sentences[:2]) + ("." if len(sentences) >= 2 else "")
            conclusion = " ".join(sentences[-2:]) + ("." if len(sentences) >= 2 else "")
            entries.append({
                "id": len(entries) + 1,
                "title": title or "Untitled",
                "authors": authors or "Unknown",
                "year": year or "",
                "journal": venue,
                "abstract": abstract or "Abstract not available.",
                "introduction": introduction or abstract or "Introduction not available.",
                "conclusion": conclusion or abstract or "Conclusion not available.",
            })
        return entries
    except Exception as e:
        print("Semantic Scholar search error:", e)
        return []


def search_openalex(query: str, max_results: int = 2):
    try:
        uri = urllib.parse.quote(query)
        url = (
            f"https://api.openalex.org/works?search={uri}&per-page={max_results}"
        )
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "EPL ResearchMode/1.0",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(request, timeout=20) as resp:
            body = resp.read().decode("utf-8")

        result = json.loads(body)
        items = result.get("results", [])
        entries = []
        for item in items:
            title = (item.get("display_name") or "Untitled").strip()
            authors = ", ".join(
                [
                    a.get("author", {}).get("display_name", "").strip()
                    for a in item.get("authorships", [])
                    if a.get("author", {}).get("display_name")
                ]
            )
            year = str(item.get("publication_year")) if item.get("publication_year") else ""
            venue = item.get("host_venue", {}).get("display_name") or "OpenAlex"
            abstract = ""
            if item.get("abstract"):
                abstract = item.get("abstract").strip()
            elif item.get("abstract_inverted_index"):
                index = item["abstract_inverted_index"]
                tokens = []
                max_pos = max((pos for positions in index.values() for pos in positions), default=-1)
                tokens = [""] * (max_pos + 1)
                for word, positions in index.items():
                    for pos in positions:
                        if 0 <= pos < len(tokens):
                            tokens[pos] = word
                abstract = " ".join([t for t in tokens if t])
            if not abstract:
                abstract = "Abstract unavailable from OpenAlex metadata. Use the DOI or URL to read the full paper."

            sentences = [s.strip() for s in abstract.split(".") if s.strip()]
            introduction = " ".join(sentences[:2]) + ("." if len(sentences) >= 2 else "")
            conclusion = " ".join(sentences[-2:]) + ("." if len(sentences) >= 2 else "")
            if not introduction:
                introduction = "Use the DOI or URL to access the full paper and read the detailed introduction."
            if not conclusion:
                conclusion = "Use the DOI or URL to access the full paper and read the full conclusion."

            entries.append({
                "id": len(entries) + 1,
                "title": title,
                "authors": authors or "Unknown",
                "year": year or "",
                "journal": venue,
                "abstract": abstract,
                "introduction": introduction,
                "conclusion": conclusion,
            })
        return entries
    except Exception as e:
        print("OpenAlex search error:", e)
        return []


def search_crossref(query: str, max_results: int = 2):
    try:
        uri = urllib.parse.quote(query)
        url = (
            f"https://api.crossref.org/works?query={uri}&rows={max_results}&sort=score"
        )
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "EPL ResearchMode/1.0",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(request, timeout=20) as resp:
            body = resp.read().decode("utf-8")

        result = json.loads(body)
        items = result.get("message", {}).get("items", [])
        entries = []
        for item in items:
            title_list = item.get("title", [])
            title = title_list[0].strip() if title_list else "Untitled"
            authors = ", ".join(
                [
                    f"{author.get('given', '').strip()} {author.get('family', '').strip()}".strip()
                    for author in item.get("author", [])
                    if author.get("given") or author.get("family")
                ]
            )
            year = ""
            if item.get("published-print") and item["published-print"].get("date-parts"):
                year = str(item["published-print"]["date-parts"][0][0])
            elif item.get("published-online") and item["published-online"].get("date-parts"):
                year = str(item["published-online"]["date-parts"][0][0])
            venue = item.get("container-title", [""])[0] or item.get("publisher", "Crossref")
            abstract_text = item.get("abstract") or ""
            abstract = unescape(abstract_text).strip() if abstract_text else "Abstract unavailable from Crossref metadata. Use the DOI for the full paper."
            sentences = [s.strip() for s in abstract.split(".") if s.strip()]
            introduction = " ".join(sentences[:2]) + ("." if len(sentences) >= 2 else "")
            conclusion = " ".join(sentences[-2:]) + ("." if len(sentences) >= 2 else "")
            if not introduction:
                introduction = "Use the DOI or URL to access the full paper and read its introduction."
            if not conclusion:
                conclusion = "Use the DOI or URL to access the full paper and read its conclusion."
            entries.append({
                "id": len(entries) + 1,
                "title": title,
                "authors": authors or "Unknown",
                "year": year or "",
                "journal": venue or "Crossref",
                "abstract": abstract,
                "introduction": introduction,
                "conclusion": conclusion,
            })
        return entries
    except Exception as e:
        print("Crossref search error:", e)
        return []


def search_online_papers(query: str, max_results: int = 2):
    results = search_arxiv(query, max_results)
    if results:
        return results
    results = search_openalex(query, max_results)
    if results:
        return results
    results = search_semantic_scholar(query, max_results)
    if results:
        return results
    return search_crossref(query, max_results)


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
    online_results = search_online_papers(q, max_results=2)
    if online_results:
        return {"results": online_results}

    print("Online search returned no results.")
    return {"results": []}

