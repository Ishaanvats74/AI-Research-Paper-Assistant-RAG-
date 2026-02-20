from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = OllamaEmbeddings(model="qwen3-embedding:0.6b")
llm = ChatOllama(model="llama3.1:8b")

VECTOR_DB_PATH = "faiss_index"
UPLOAD_PATH = "uploaded.pdf"

retriever = None

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    
    with open(UPLOAD_PATH, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    loader = PyMuPDFLoader(UPLOAD_PATH)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(docs)

    vector_store = FAISS.from_documents(chunks, embeddings)

    vector_store.save_local(VECTOR_DB_PATH)

    return {"message": "PDF Indexed Successfully"}


def format_docs(retriever_docs):
    return "\n".join([doc.page_content for doc in retriever_docs])


@app.post("/chat")
async def chat(question: dict):

    vector_store = FAISS.load_local(
        VECTOR_DB_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k":10}
    )

    prompt = PromptTemplate(
        template="""
            Use ONLY the provided context to answer the question.

            Context:
            {context}

            Question:
            {question}

            Answer:
            """,
        input_variables=["context","question"]
    )

    parallel_chain = RunnableParallel({
        "context": retriever | RunnableLambda(format_docs),
        "question": RunnablePassthrough()
    })

    parser = StrOutputParser()

    chain = parallel_chain | prompt | llm | parser

    answer = chain.invoke(question["question"])

    return {"answer": answer}



