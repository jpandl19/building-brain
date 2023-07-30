from urllib.parse import urlparse
import time
import os
import pandas as pd
import tiktoken
import math
import openai
import numpy as np
import json
from openai.embeddings_utils import distances_from_embeddings, cosine_similarity
from api.util import query_vector_db
OPENAI_SECRET_KEY = os.getenv("OPENAI_SECRET_KEY", 'No secret key found')
openai.api_key = OPENAI_SECRET_KEY

# OUTPUT_FILE = "./data/processed/embeddings.json"

################################################################################
'''
    CONSTANTS
'''
RECREATE_EMBEDDINGS = False

MAX_CONTEXT_LENGTH_TOKENS = 2000
MAX_RESPONSE_TOKENS = 1000
################################################################################

# Load the cl100k_base tokenizer which is designed to work with the ada-002 model
tokenizer = tiktoken.get_encoding("cl100k_base")

global total_token_count
total_token_count = 0
global total_exectution_count
total_exectution_count = 0


def pretty_print(msg):
    print("=====================================================")
    print(f"{msg}")
    print("=====================================================")


def calculate_prompt_token_count(passed_prompt):
    # if an array of strings was passed in, lets concat them
    if isinstance(passed_prompt, list):
        prompt = json.dumps(passed_prompt)
    else:
        prompt = passed_prompt

    tokenizerOutput = tokenizer.encode(prompt)
    tokenCount = len(tokenizerOutput)
    return tokenCount


def calculate_response_token_count(prompt):
    return calculate_prompt_token_count(prompt)


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
def split_into_many(text, max_tokens=MAX_CONTEXT_LENGTH_TOKENS):

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


def create_context(
    question, max_len=MAX_CONTEXT_LENGTH_TOKENS, diagnostics_data="No Diagnostics Given", size="ada"
):
    """
    Create a context for a question by finding the most similar context from the dataframe
    """
    # query our vectorDb for the question
    sorted_results = query_vector_db(question)
    returns = []
    cur_len = 0
    # Sort by distance and add the text to the context until the context is too long
    for i, row in enumerate(sorted_results):
        references_prompt = f"""
            [REFERENCE_BLOCK]
            page number {row['pageNumber']}
            paragraph number: {row['paragraphNumber']}    
            [/REFERENCE_BLOCK]    
        """
        context_prompt = f"""
            [CONTEXT_BLOCK]
            {row['text']}    
            [/CONTEXT_BLOCK]    
        """

        diagnostics_prompt = f"""
            [DIAGNOSTICS_BLOCK]
                {diagnostics_data}  
            [/DIAGNOSTICS_BLOCK]    
        """
        # Add the length of the text to the current length
        cur_len += row['tokens'] + 4 + \
            len(diagnostics_prompt) + \
            len(references_prompt) + len(context_prompt)

        # If the context is too long, break
        if cur_len > max_len:
            break

        # Else add it to the text that is being returned
        returns.append(f"""
            [CONTEXT_BLOCK]
            context block: {i + 1}
            {references_prompt.strip()}
            {diagnostics_prompt.strip()}
            {context_prompt.strip()}
            [/CONTEXT_BLOCK]
            """
                       )

    # Return the context
    return "\n\n###\n\n".join(returns), sorted_results


def create_context_legacy(
    question, df, data_embeddings, max_len=MAX_CONTEXT_LENGTH_TOKENS, size="ada"
):
    """
    Create a context for a question by finding the most similar context from the dataframe
    """

    # Get the embeddings for the question
    q_embeddings = openai.Embedding.create(
        input=question, engine='text-embedding-ada-002')['data'][0]['embedding']

    # Get the distances from the embeddings
    df['distances'] = distances_from_embeddings(
        q_embeddings, data_embeddings, distance_metric='cosine')

    returns = []
    cur_len = 0

    # Sort by distance and add the text to the context until the context is too long
    for i, row in df.sort_values('distances', ascending=True).iterrows():

        # Add the length of the text to the current length
        cur_len += row['n_tokens'] + 4

        # If the context is too long, break
        if cur_len > max_len:
            break

        # Else add it to the text that is being returned
        returns.append(row["concat_text"])

    # Return the context
    return "\n\n###\n\n".join(returns)


def answer_question(
    model="claude-2",
    question="What is wrong with my building?",
    max_len=MAX_CONTEXT_LENGTH_TOKENS,
    size="ada",
    debug=False,
    platformId=0,
    max_tokens=MAX_RESPONSE_TOKENS,
    stop_sequence=None,
    previous_message=None,
    max_response_length=150,
    use_vector_db=False
):
    """
    Answer a question based on the most similar context from the dataframe texts
    """
    context = ""
    top_results = []
    # only use the vector db if we are on the hvac platform
    if (use_vector_db == True and platformId == 1):
        context, top_results = create_context(
            question,
            max_len=max_len,
            size=size,
        )
        pass
    # If debug, print the raw model response
    if debug:
        print("Context:\n" + context)
        print("\n\n")

    try:
        init_messages = [
            {"role": "system", "content": "You are an experienced AC Repair technician. It is now your job to help answer questions for new AC repair technicians.You can answer questions about the AC Repair, troubleshooting, startup and more."},
            {"role": "user", "content": "What is an AC Condenser?"},
            {"role": "assistant",
             "content": f"A condenser (or AC condenser) is the outdoor portion of an air conditioner or heat pump that either releases or collects heat, depending on the time of the year."},
        ]

        if (previous_message != None):
            init_messages.append(
                {"role": "user", "content": f"{previous_message.get('userMessage', 'No previous message found.')}"},)
            init_messages.append(
                {"role": "assistant", "content": f"{previous_message.get('modelResponse', 'No previous model response found')}"},)

        # lets add the question and context to the init prompt
        init_messages.append(
            # {"role": "user", "content": f"Given the context: {context}, can you answer the question: {question}. Please format your response as html. Include image sources if you find image sources in the context. Please ensure that the HTML is formatted such that the text is on the right, and the image, if any, is on the left in a two column layout. Your response can have a maximum limit of {max_response_length} words. However if a response that is shorter than {max_response_length} words is available, please return that response."}
            {"role": "user", "content": f"Given the context: {context}, can you answer the question: {question}. Please format your response as HTML. Your response can have a maximum limit of {max_response_length} words. However if a response that is shorter than {max_response_length} words is available, please return that response."}
        )

        #  if we have a zero platformId that means we should load in PastorGPT mode
        if (platformId == 0):
            init_messages = [
                {"role": "system", "content": "You are an experienced scholar of the Bible. You can answer questions about the Bible and its contents and well as theorize on how the bible applies to everyday human life."},
                {"role": "user", "content": "Tell me about Jesus Christ and his teachings."},
                {"role": "assistant", "content": f"Jesus Christ, the central figure of Christianity, was born in Bethlehem to Mary and Joseph. He is believed to be both fully divine and fully human, the Son of God and the Messiah prophesied in the Old Testament. Jesus' teachings focused on love, forgiveness, and compassion, emphasizing the importance of humility, service to others, and the pursuit of righteousness. One interesting aspect of Jesus' life is his ability to perform miracles, which demonstrated his divine power and authority. Some of the most well-known miracles include turning water into wine at a wedding in Cana, feeding a large crowd with only a few loaves of bread and fish, walking on water, and healing the sick and disabled. These miracles not only showcased his divine nature but also served as a means to spread his message and teachings. Another fascinating aspect of Jesus' life is his interactions with various groups of people, such as the Pharisees, Sadducees, and tax collectors. He often challenged the religious and social norms of his time, advocating for the marginalized and downtrodden. Jesus' teachings and actions ultimately led to his crucifixion by the Roman authorities, but Christians believe that he rose from the dead three days later, conquering death and sin, and offering salvation to all who believe in him."},
            ]

            if (previous_message != None):
                init_messages.append(
                    {"role": "user", "content": f"{previous_message.get('userMessage', 'No previous message found.')}"},)
                init_messages.append(
                    {"role": "assistant", "content": f"{previous_message.get('modelResponse', 'No previous model response found')}"},)

            # lets add the question and context to the init prompt
            init_messages.append(
                {"role": "user", "content": f"Given the context: {context}, can you answer the question: {question}. Please format your response as html. Your response can have a maximum limit of {max_response_length} words. However if a response that is shorter than {max_response_length} words is available, please return that response."}
            )

        init_messages_token_count = calculate_prompt_token_count(init_messages)

        pretty_print(
            f"Prompt + Context Token Count: {init_messages_token_count}")

        # Create a completions using the questin and context
        response = openai.ChatCompletion.create(
            messages=init_messages,
            temperature=0,
            max_tokens=max_tokens,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            stop=stop_sequence,
            model=model,
        )
        response_token_count = calculate_response_token_count(
            response['choices'][0]['message']['content'].strip())
        pretty_print(f"Response Token Count: {response_token_count}")
        pretty_print(
            f"Total Token Count: {init_messages_token_count + response_token_count}")



        return response, top_results
    except Exception as e:
        print(e)
        return "I apologize, an error occurred while I was thinking about your message. Please try again or contact our support at <a href=\"mailto:support@pastorgpt.app\">support@pastorgpt.app</a>."


if __name__ == '__main__':
    example_question_1 = "What is the upflow installation for this unit?"
    example_question_2 = "How should I live my life?"

    answer1 = answer_question(
        None, question=example_question_1, use_vector_db=True)["choices"][0]["message"]
    print("=====================================")
    print(f"Question:{example_question_1}")
    print("=====================================")
    print(f"Answer: {answer1}")
    print("=====================================")
