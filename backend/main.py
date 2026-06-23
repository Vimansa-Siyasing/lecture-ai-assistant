import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag import extract_text_from_pdf, build_vectorstore, get_qa_chain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

vectorstore = None
qa_chain = None

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class QuestionRequest(BaseModel):
    question: str

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global vectorstore, qa_chain
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF files only!")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    text = extract_text_from_pdf(file_path)
    vectorstore = build_vectorstore(text)
    qa_chain = get_qa_chain(vectorstore)
    
    return {"message": "PDF uploaded and processed!", "filename": file.filename}

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    global qa_chain
    
    if not qa_chain:
        raise HTTPException(status_code=400, detail="Upload a PDF first!")
    
    result = qa_chain.invoke({"query": request.question})
    return {"answer": result["result"]}

@app.get("/")
async def root():
    return {"message": "Lecture AI Assistant API Running!"}