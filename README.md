# 📚 LectureAI Study Assistant

An AI-powered study companion that turns your lecture PDFs into chat Q&A, summaries, flashcards, quizzes, and key term glossaries — built with FastAPI, LangChain, ChromaDB, and Groq's LLaMA 3.1.

🔗 **Live demo:** [lecture-ai-assistant.vercel.app](https://lecture-ai-assistant.vercel.app)

---

## ✨ Features

- 💬 **Chat Q&A** — ask anything about your lecture, answered via RAG over the PDF content
- 📄 **Summary** — auto-generated concise overview of the document
- 🃏 **Flashcards** — tap-to-flip cards for quick revision
- 🧠 **Quiz** — auto-generated multiple-choice quizzes, regenerate for new sets
- 🔑 **Key Terms** — extracted glossary of important terms and definitions
- 📱 **Fully responsive** — sidebar navigation on desktop, bottom tab bar on mobile

---

## 🖥️ Desktop view

> Sidebar navigation, full-width chat and content panels.

| | | |
|---|---|---|
| ![Desktop 1](./screenshots/desktop-1.png) | ![Desktop 2](./screenshots/desktop-2.png) | ![Desktop 3](./screenshots/desktop-3.png) |
| ![Desktop 4](./screenshots/desktop-4.png) | ![Desktop 5](./screenshots/desktop-5.png) | ![Desktop 6](./screenshots/desktop-6.png) |

---

## 📱 Mobile view

> Bottom tab bar navigation, compact layout optimized for small screens.

| | | |
|---|---|---|
| ![Mobile 1](./screenshots/mobile-1.png) | ![Mobile 2](./screenshots/mobile-2.png) | ![Mobile 3](./screenshots/mobile-3.png) |
| ![Mobile 4](./screenshots/mobile-4.png) | ![Mobile 5](./screenshots/mobile-5.png) | ![Mobile 6](./screenshots/mobile-6.png) |

---

## 🛠️ Tech stack

**Backend**
- FastAPI
- LangChain (LCEL)
- ChromaDB (vector store)
- HuggingFace Embeddings (`all-MiniLM-L6-v2`)
- Groq — LLaMA 3.1

**Frontend**
- React + Vite
- TailwindCSS
- Axios

**Deployment**
- Backend: Hugging Face Spaces
- Frontend: Vercel
- Uptime monitoring: UptimeRobot

---

## 🚀 Getting started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Set environment variables:
```
GROQ_API_KEY=your_groq_api_key
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set environment variables in `.env`:
```
VITE_API_URL=http://localhost:8000
```

---

## 📂 Project structure

```
lecture-ai-assistant/
├── backend/
│   ├── main.py
│   ├── rag.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   └── package.json
└── screenshots/
    ├── desktop-1.png
    ├── desktop-2.png
    ├── desktop-3.png
    ├── desktop-4.png
    ├── desktop-5.png
    ├── desktop-6.png
    ├── mobile-1.png
    ├── mobile-2.png
    ├── mobile-3.png
    ├── mobile-4.png
    ├── mobile-5.png
    └── mobile-6.png
```

---

## 👤 Author

**Vimansa Siyasinghe**
3rd-year BSc (Hons) Software Engineering — NSBM Green University

[LinkedIn](#) · [GitHub](https://github.com/Vimansa-Siyasing)
