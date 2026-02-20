from fastapi import FastAPI
from langchain_ollama import ChatOllama

from langchain_core.output_parsers import StrOutputParser


app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}


