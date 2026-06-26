import os
import shutil
import random
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag import extract_text_from_pdf, build_vectorstore, get_qa_chain, get_llm, get_vectorstore_retriever
from langchain.prompts import PromptTemplate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

vectorstore = None
qa_chain = None
llm = None

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class QuestionRequest(BaseModel):
    question: str

class QuizRequest(BaseModel):
    seed: int = 0  # 0 = first generation, >0 = regenerate

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global vectorstore, qa_chain, llm
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF files only!")
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    text = extract_text_from_pdf(file_path)
    vectorstore = build_vectorstore(text)
    qa_chain = get_qa_chain(vectorstore)
    llm = get_llm()
    return {"message": "PDF uploaded and processed!", "filename": file.filename}

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    global qa_chain
    if not qa_chain:
        raise HTTPException(status_code=400, detail="Upload a PDF first!")
    result = qa_chain.invoke({"query": request.question})
    return {"answer": result["result"]}

@app.post("/summary")
async def get_summary():
    global vectorstore, llm
    if not vectorstore or not llm:
        raise HTTPException(status_code=400, detail="Upload a PDF first!")
    docs = vectorstore.similarity_search("main topics and key concepts", k=5)
    context = "\n".join([d.page_content for d in docs])
    prompt = f"""Based on the following lecture content, provide a clear and structured summary with main topics and key points:

{context}

Summary:"""
    response = llm.invoke(prompt)
    return {"summary": response.content}

@app.post("/keyterms")
async def get_key_terms():
    global vectorstore, llm
    if not vectorstore or not llm:
        raise HTTPException(status_code=400, detail="Upload a PDF first!")
    docs = vectorstore.similarity_search("definitions terminology concepts", k=5)
    context = "\n".join([d.page_content for d in docs])
    prompt = f"""Extract the key terms and their definitions from the following lecture content. Return as JSON array like:
[{{"term": "...", "definition": "..."}}]
Only return the JSON array, nothing else.

Content:
{context}"""
    response = llm.invoke(prompt)
    import json, re
    text = response.content
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        terms = json.loads(match.group())
    else:
        terms = []
    return {"terms": terms}

@app.post("/flashcards")
async def get_flashcards():
    global vectorstore, llm
    if not vectorstore or not llm:
        raise HTTPException(status_code=400, detail="Upload a PDF first!")
    docs = vectorstore.similarity_search("important concepts facts definitions", k=5)
    context = "\n".join([d.page_content for d in docs])
    prompt = f"""Create 6 flashcards from the following lecture content. Return as JSON array like:
[{{"front": "question or term", "back": "answer or definition"}}]
Only return the JSON array, nothing else.

Content:
{context}"""
    response = llm.invoke(prompt)
    import json, re
    text = response.content
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        cards = json.loads(match.group())
    else:
        cards = []
    return {"flashcards": cards}

# Varied search queries — seed අනුව different chunks select වෙනවා
QUIZ_QUERY_VARIANTS = [
    "concepts facts topics",
    "key principles theories examples",
    "definitions processes methods techniques",
    "important ideas applications outcomes",
    "core topics challenges and solutions",
    "fundamental concepts and their relationships",
    "specific details examples case studies",
]

@app.post("/quiz")
async def get_quiz(request: QuizRequest = QuizRequest()):
    global vectorstore, llm
    if not vectorstore or not llm:
        raise HTTPException(status_code=400, detail="Upload a PDF first!")

    # Seed අනුව query + temperature vary කරනවා
    seed = request.seed
    query = QUIZ_QUERY_VARIANTS[seed % len(QUIZ_QUERY_VARIANTS)]

    # Regenerate වෙන වාරේ temperature ටිකක් raise කරනවා (max 0.85)
    temperature = min(0.3 + (seed * 0.1), 0.85)

    from langchain_groq import ChatGroq
    dynamic_llm = ChatGroq(
        model="llama-3.1-8b-instant",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=temperature,
    )

    docs = vectorstore.similarity_search(query, k=5)
    context = "\n".join([d.page_content for d in docs])

    # Seed info prompt එකේ දාලා LLM ට hint දෙනවා
    prompt = f"""Create 5 NEW and DIFFERENT multiple choice questions from the following lecture content.
Make sure these questions are different from any previous quiz questions generated.
Focus on varied aspects: definitions, applications, comparisons, cause-effect, examples.
Return as JSON array like:
[{{"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A"}}]
Only return the JSON array, nothing else.

Content:
{context}

Quiz variation #{seed + 1} — focus on different angles than previous quizzes."""

    response = dynamic_llm.invoke(prompt)
    import json, re
    text = response.content
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        questions = json.loads(match.group())
    else:
        questions = []
    return {"questions": questions, "seed": seed}

@app.get("/")
async def root():
    return {"message": "Lecture AI Assistant API Running!"}