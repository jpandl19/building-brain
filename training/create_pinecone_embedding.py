import requests
import re
import urllib.request
from bs4 import BeautifulSoup
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urlparse
import time
import os
import pandas as pd
import pinecone
import uuid

import tiktoken
import math
import openai
import numpy as np
from openai.embeddings_utils import distances_from_embeddings, cosine_similarity
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
from dotenv import load_dotenv
import boto3
from pypdf import PdfReader
import io
import json
from datetime import datetime
from api.db.BuildingBrainCustomFiles import get_item_by_id, get_s3_client
from api.util import create_openai_embeddings
from api.db.BuildingBrainCustomFiles import get_item_by_id, get_items_by_email, update_item_by_id, get_all_files

load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME", 'building-brain-custom-files')
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", 'No secret key found')
OPENAI_SECRET_KEY = os.getenv("OPENAI_SECRET_KEY", 'No secret key found')
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", 'building-brain-custom-files')
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", 'us-west1-gcp-free')
DEFAULT_PINECONE_NAMESPACE = os.getenv(
    "DEFAULT_PINECONE_NAMESPACE", 'building-brain-org-1')

openai.api_key = OPENAI_SECRET_KEY

'''
CONSTANTS
'''

MAX_TOKENS = 500

# Load the cl100k_base tokenizer which is designed to work with the ada-002 model
tokenizer = tiktoken.get_encoding("cl100k_base")

global embeddings_index
embeddings_index = 0
global total_token_count
total_token_count = 0
global total_exectution_count
total_exectution_count = 0


def tokenize(x):
    global total_token_count
    global total_exectution_count
    if (x == None):
        return 0
    token_count = len(tokenizer.encode(x))
    total_token_count = total_token_count + token_count
    total_exectution_count += 1
    return token_count


# Function to split the text into chunks of a maximum number of tokens
def split_into_many(text, max_tokens=MAX_TOKENS):

    # Split the text into sentences
    sentences = text.split('. ')

    # Get the number of tokens for each sentence
    n_tokens = [len(tokenizer.encode(" " + sentence))
                for sentence in sentences]

    chunks = []
    tokens_so_far = 0
    chunk = []

    # Loop through the sentences and tokens joined together in a tuple
    for sentence, token in zip(sentences, n_tokens):

        # If the number of tokens so far plus the number of tokens in the current sentence is greater
        # than the max number of tokens, then add the chunk to the list of chunks and reset
        # the chunk and tokens so far
        if tokens_so_far + token > max_tokens:
            chunks.append(". ".join(chunk) + ".")
            chunk = []
            tokens_so_far = 0

        # If the number of tokens in the current sentence is greater than the max number of
        # tokens, go to the next sentence
        if token > max_tokens:
            continue

        # Otherwise, add the sentence to the chunk and add the number of tokens to the total
        chunk.append(sentence)
        tokens_so_far += token + 1

    # Add the last chunk to the list of chunks
    if chunk:
        chunks.append(". ".join(chunk) + ".")

    return chunks


def extract_text_from_pdf(file_stream):
    # Read the file from the S3 Bucket
    pdf_reader = PdfReader(file_stream)

    # Initialize an empty string for the text
    text = []

    # Loop through each page in the pdf and extract the text
    for page in pdf_reader.pages:
        # Check if the page contains any text
        page_text = page.extract_text()
        if not page_text.strip():
            # If not, convert the page to an image and perform OCR
            images = convert_from_bytes(file_stream.read())
            page_image = images[page.page_number - 1]  # Pages are 1-indexed
            page_text = pytesseract.image_to_string(page_image)

        text.append(page_text)

    return text


def create_embeddings_for_file(fileId, bucket_name=BUCKET_NAME, passed_index_name=PINECONE_INDEX_NAME):
    # Initialize the Pinecone client
    pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)

    # Specify the name of your Pinecone index
    index_name = passed_index_name

    # get the index
    index = None
    # # Create the index if it doesn't exist
    if index_name not in pinecone.list_indexes():
        pinecone.create_index(
            name=index_name, dimension=1536, metric="cosine", shards=1)
        index = pinecone.Index(index_name)
    else:
        index = pinecone.Index(index_name)

    # Get the file from DynamoDB
    file_record = get_item_by_id(fileId)

    # Download the PDF file from the S3 bucket
    s3 = get_s3_client()
    file_obj = s3.get_object(Bucket=bucket_name, Key=fileId)
    file_stream = io.BytesIO(file_obj['Body'].read())

    # Extract the text from the PDF
    file_text = extract_text_from_pdf(file_stream)

    # Initialize the embeddings list and counter
    embeddings = []
    counter = 0

    # Define the filename with the current date time stamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"embeddings_{timestamp}.json"
    print("=====================================")
    print("=====================================")
    print(
        f"Creating Emeddings for new document title: {file_record.get('filename')}")
    # Loop over each page's text
    for page_number, page_text in enumerate(file_text, start=1):
        # Tokenize the text and get the number of tokens
        n_tokens = tokenize(page_text)

        # If the number of tokens is greater than the max number of tokens, split the text into chunks
        chunks = split_into_many(
            page_text) if n_tokens > MAX_TOKENS else [page_text]

        # Create embeddings for each chunk of text
        for paragraph_number, chunk in enumerate(chunks, start=1):
            embedding = create_openai_embeddings(chunk)
            embeddingId = str(uuid.uuid4())
            embeddings.append({
                'file_id': fileId,
                'text': chunk,
                'embedding_id': embeddingId,
                'page_number': page_number,
                'paragraph_number': paragraph_number,
                'tokens': n_tokens,
                'embedding': embedding
            })
            print(f"Embedding is {len(embedding)} dimmensions")
            # Increment the counter and check if it has reached 5
            counter += 1
            if counter == 1:
                print("=====================================")
                print("Upserting embeddings into Pinecone")
                # Upsert embeddings into Pinecone
                upsert_data = [(str(embeddingId), embeddings[i]['embedding'],
                                {'text': embeddings[i]['text'],
                                    "page_number": embeddings[i]['page_number'],
                                    "tokens": embeddings[i]['tokens'],
                                    'filename': file_record.get('filename'),
                                    'dynamodb_id': file_record.get('id'),
                                 "paragraph_number": embeddings[i]['paragraph_number']}) for i in range(len(embeddings))]
                index.upsert(upsert_data, namespace=DEFAULT_PINECONE_NAMESPACE)
                print("=====================================")
                # Save the embeddings to a json file
                with open(filename, 'w') as f:
                    json.dump(embeddings, f)

                # Reset the counter and the embeddings list
                counter = 0
                embeddings = []

    # Upsert any remaining embeddings and save them to a json file
    if counter > 0:
        print("=====================================")
        print("Upserting FINAL embeddings into Pinecone for this document")
        # Upsert embeddings into Pinecone
        upsert_data = [(str(embeddingId), embeddings[i]['embedding'],
                        {'text': embeddings[i]['text'],
                        "page_number": embeddings[i]['page_number'],
                         "tokens": embeddings[i]['tokens'],
                         'filename': file_record.get('filename'),
                         'dynamodb_id': file_record.get('id'),
                         "paragraph_number": embeddings[i]['paragraph_number']}) for i in range(len(embeddings))]
        index.upsert(upsert_data, namespace=DEFAULT_PINECONE_NAMESPACE)
        print("=====================================")

        with open(filename, 'w') as f:
            json.dump(embeddings, f)

    # Update 'embedded' property of the file record
    file_record['embedded'] = True
    update_item_by_id(fileId, file_record)
    print(
        f"Finished Emeddings for document title: {file_record.get('filename')}")
    print("=====================================")
    print("=====================================")
    print("|")
    print("|")
    print("|")



    # lets make sure to only upsert to the index, if the embedding has completed without issue
    return embeddings


def create_embeddings_for_all_documents_without_embeddings(userEmail=None):
    items = []
    if(userEmail == None):
        items = get_all_files()
    else:
        items = get_items_by_email(userEmail)

    for idx, item in enumerate(items):
        try:
            if (item.get('embedded') != False):
                print(
                    f"SKIPPING ITEM Item with ID: {item.get('id')} because it has already been processed")
                continue
            print("=====================================")
            print(f"Processing item {idx + 1} of {len(items)}")
            create_embeddings_for_file(
                item.get('id'), BUCKET_NAME, PINECONE_INDEX_NAME)
            print(f"Finished processing item {idx + 1} of {len(items)}")
            print("=====================================")
        except Exception as e:
            print(
                f"Exception occurred while processing item {idx + 1} of {len(items)}: {str(e)}")

    print("=====================================")
    print("=====================================")
    print("Completed processing all items")


if __name__ == "__main__":
    pass
    # create_embeddings_for_all_documents_without_embeddings(
    #     "averyp@lionsoft.net")
    # create_embeddings_for_all_documents_without_embeddings();
    # Create the embedding field we need to create the embeddings
    # create_embeddings_for_file(
    #     "2f27d809-a012-4841-b3f6-278b07acb45f", BUCKET_NAME,)

    # THIS IS OUR OCR TEST FILE - we still need to build the OCR test case
    # create_embeddings_for_file(
    # "8d4f7d9b-6119-4e1b-9a72-a1f2133e4e0f", BUCKET_NAME,)
