import pinecone
import os
import openai
import time

BUCKET_NAME = os.getenv("BUCKET_NAME", 'building-brain-custom-files')
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", 'No secret key found')
OPENAI_SECRET_KEY = os.getenv("OPENAI_SECRET_KEY", 'No secret key found')
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", 'building-brain-custom-files')
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", 'us-west1-gcp-free')
DEFAULT_PINECONE_NAMESPACE = os.getenv("DEFAULT_PINECONE_NAMESPACE", 'building-brain-org-2')
DEFAULT_TOP_K = 10
openai.api_key = OPENAI_SECRET_KEY



def query_vector_db(query, index_name=PINECONE_INDEX_NAME, environment=PINECONE_ENVIRONMENT, namespace=DEFAULT_PINECONE_NAMESPACE):
    # Initialize the Pinecone client
    pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)

    # Initialize the Pinecone index
    index = pinecone.Index(index_name=index_name)

    # Create an embedding for the prompt
    embedding = create_openai_embeddings(query)
    # Query the Pinecone vector database using the embedding
    results = index.query(
        vector=embedding,
        top_k=DEFAULT_TOP_K,
        include_values=True,
        include_metadata=True,
        namespace=namespace,
    )

    # Format the results
    formatted_results = []
    matches = results.get('matches', [])
    for result in matches:
        formattted_result = format_pinecone_response(result)
        formatted_results.append(formattted_result)

    # Sort the results by the 'score' key in descending order
    sorted_results = sorted(
        formatted_results, key=lambda x: x['score'], reverse=True)

    return sorted_results


def delete_vectors(ids, index_name):
    # Initialize the Pinecone client
    pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)

    # Initialize the Pinecone index
    index = pinecone.Index(index_name=index_name)
    # Get all vector IDs in the index
    # Delete all vectors
    index.delete(ids=ids)

def format_pinecone_response(result):
    formatted_result = {
        "score": result["score"],
        'tokens': result["metadata"].get("tokens", 0),
        "text": result["metadata"].get("text", "No Text Found. Corrupted Embedding."),
        'filename': result["metadata"].get("filename", "No Name Found. Corrupted Embedding."),
        'dynamodb_id': result["metadata"].get("dynamodb_id", "No DynamoID Found. Corrupted Embedding."),
        "pageNumber": result["metadata"].get("page_number", "No page number Found. Corrupted Embedding."),
        "paragraphNumber": result["metadata"].get("paragraph_number", "No paragraph number Found. Corrupted Embedding."),
    }
    return formatted_result


global embeddings_index
embeddings_index = 0


def create_openai_embeddings(input):
    try:
        global embeddings_index
        print(f"Creating Embedding for data row {embeddings_index + 1}")
        embedding = openai.Embedding.create(
            input=input, engine='text-embedding-ada-002')['data'][0]['embedding']
        embeddings_index += 1
        time.sleep(1)
        return embedding
    except Exception as e:
        print(f"Error creating embedding for data row {embeddings_index + 1}")
        print(e)