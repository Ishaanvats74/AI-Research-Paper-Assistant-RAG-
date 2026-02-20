from langchain_community.document_loaders import PyPDFLoader,PyMuPDFLoader
from langchain_ollama import OllamaEmbeddings,ChatOllama
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

def format_docs(retriever_docs):
    context = "\n".join([doc.page_content for doc in retriever_docs])
    return context

embeddings = OllamaEmbeddings(model="qwen3-embedding:0.6b")


file_path="Computer Networks - A Tanenbaum - 5th edition.pdf"
loader = PyMuPDFLoader(file_path)
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=200)
chunks = text_splitter.split_documents(docs)


vector_store = FAISS.from_documents(embedding=embeddings,documents=chunks)

retriever = vector_store.as_retriever(search_type="similarity",search_kwargs={"k":10})


llm = ChatOllama(model="llama3.1:8b")

prompt = PromptTemplate(
    template="""
You are an AI assistant helping a student understand the contents of a textbook.

Use ONLY the provided context to answer the question.

Do NOT use your own knowledge.
Do NOT hallucinate information.

However, you may:
- summarize the information
- explain in simpler terms
- combine ideas from multiple context chunks
- elaborate on the concepts present in the context

If the answer is not present in the context, say:
"I don't know based on the provided document."

Context:
{context}

Question:
{question}

Give a detailed and well-explained answer:
""",
    input_variables=["context","question"]
)

parallel_chain = RunnableParallel({
    "context": retriever | RunnableLambda(format_docs),
    "question": RunnablePassthrough()
})

parser = StrOutputParser()

main_chain = parallel_chain | prompt | llm | parser

response = main_chain.invoke("what is this computer networks?")

print(response)



