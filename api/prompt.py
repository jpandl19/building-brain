import os
from dotenv import load_dotenv, find_dotenv
from langchain.memory import ChatMessageHistory
from humanloop import Humanloop
from api.diagnose import create_openai_embeddings
import pinecone
from .util import query_vector_db
BUCKET_NAME = os.getenv("BUCKET_NAME", 'building-brain-custom-files')
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", 'No secret key found')
OPENAI_SECRET_KEY = os.getenv("OPENAI_SECRET_KEY", 'No secret key found')
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", 'building-brain-custom-files')
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", 'us-west1-gcp-free')
DEFAULT_PINECONE_NAMESPACE = os.getenv("DEFAULT_PINECONE_NAMESPACE", 'building-brain-org-2')
DEFAULT_TOP_K = 10

load_dotenv(find_dotenv())

HUMANLOOP_API_KEY = os.getenv("HUMANLOOP_API_KEY")

PINECONEINDEX = pinecone.Index(PINECONE_INDEX_NAME)

humanloop = Humanloop(api_key="hl_sk_8a767764cee87273c4d165bc7494862d763be42caf12b4a6")

def get_context_from_database(question):
    response = create_openai_embeddings(question)
    results=query_vector_db(response)
    return results[0]['text']

history = ChatMessageHistory()

simple_history=[]
conversation_active = True
while conversation_active:
    user_prompt = input("How can BuildingBrain help you?")
    if user_prompt.lower() == 'quit':
        print('Ending conversation.')
        conversation_active = False
    else:
        retrieved_context = get_context_from_database(user_prompt)
        user_prompt += "\n This context may be helpful to answer the question:" + retrieved_context
        response = humanloop.chat_deployed(
            project="BuildingBrain",
            inputs={},
            messages=[{ "role": "user", "content": user_prompt}],
        )
        answer = response.choices[0].message['content']
        print(answer)
        history.add_user_message(user_prompt), history.add_ai_message(answer)
        chat_history=history.messages
        simple_history.append({"role": "user", "content": user_prompt})
        simple_history.append({"role": "ai", "content": answer})

print(simple_history)





