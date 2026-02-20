from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from dotenv import load_dotenv
from pydantic import BaseModel
import chromadb
import fitz
import requests
import tempfile
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# embeddings = OllamaEmbeddings(model="qwen3-embedding:0.6b")
# llm = ChatOllama(model="llama3.1:8b")
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
llm = ChatGoogleGenerativeAI(model="gemini-3-flash")

client = chromadb.Client()

class PdfRequest(BaseModel):
    pdf_url: str

def reset_collection(collection_name="pdf_collection"):
    try:
        client.delete_collection(name=collection_name)
        print("Old collection deleted")
    except:
        print("Collection not found, creating new one")

def format_docs(retriever_docs):
    return "\n".join([doc.page_content for doc in retriever_docs])


@app.post("/ingest")
def ingest_pdf(data: PdfRequest):

    pdf_url = data.pdf_url

    head = requests.head(pdf_url)
    file_size = int(head.headers.get("content-length", 0))

    print("PDF SIZE:", file_size / (1024*1024), "MB")

    temp_path = None

    if file_size < 20 * 1024 * 1024:

        print("Loading PDF into RAM")

        response = requests.get(pdf_url)
        pdf_bytes = response.content

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    else:

        print("Downloading PDF to Disk")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:

            response = requests.get(pdf_url, stream=True)

            for chunk in response.iter_content(1024 * 1024):
                tmp.write(chunk)

            temp_path = tmp.name

        doc = fitz.open(temp_path)

    pdf_metadata = doc.metadata
    documents = []

    for i, page in enumerate(doc):

        text = page.get_text()

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "page": i+1,
                    "total_pages": len(doc),
                    "source": pdf_url,
                    "author": pdf_metadata.get("author"),
                    "title": pdf_metadata.get("title")
                }
            )
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(documents)

    reset_collection("pdf_collection")

    vector_store = Chroma.from_documents(
        documents=chunks,
        collection_name="pdf_collection",
        embedding=embeddings,
        client=client
    )

    if temp_path:
        os.remove(temp_path)

    return {"message": "PDF Indexed Successfully"}

@app.post("/chat")
async def chat(question: dict):

    vector_store = Chroma(
        collection_name="pdf_collection",
        embedding_function=embeddings,
        client=client
    )

    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k":10}
    )

    prompt = PromptTemplate(
        template="""
            You are an AI Research Assistant.

            Your task is to answer the user's question strictly using ONLY the information provided in the context below.

            Guidelines:
            - Do NOT use your own knowledge.
            - Do NOT make assumptions.
            - If the answer is not clearly present in the context, say:
            "The answer is not available in the provided document."
            - Do NOT fabricate or hallucinate any information.
            - Be concise and accurate.
            - Quote relevant facts from the context when possible.

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


@app.get("/")
def read_root():
    return {"Hello": "World"}