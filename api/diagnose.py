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
from api.AnthropicClient import query_anthropic_model
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT


OPENAI_SECRET_KEY = os.getenv("OPENAI_SECRET_KEY", 'No secret key found')
openai.api_key = OPENAI_SECRET_KEY

# OUTPUT_FILE = "./data/processed/embeddings.json"

################################################################################
'''
    CONSTANTS
'''
RECREATE_EMBEDDINGS = False

MAX_CONTEXT_LENGTH_TOKENS = 50000
MAX_RESPONSE_TOKENS = 40000
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


def convert_messages_to_anthropic_format(init_messages):
    prompt = []
    # Loop through the messages
    for message in init_messages:
        # Check the role of the message
        if message['role'] == 'system':
            prompt.append(message['content'])
        elif message['role'] == 'user':
            prompt.append(f"{HUMAN_PROMPT} {message['content']}")
        elif message['role'] == 'assistant':
            prompt.append(f"{AI_PROMPT} {message['content']}")

    return prompt


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
    if (use_vector_db == True):
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
            {"role": HUMAN_PROMPT, "content": "You are BuildingBrain, an AI assistant built to help building managers diagnose issues with equipment and systems in commercial facilities. You have access to a detailed knowledge base covering all mechanical and electrical assets in the building, including HVAC systems, plumbing, specific equipment, etc. The knowledgebase is leveraged through a database of text embeddings encoding passages from equipment manuals, service logs, and repair notes, as well as metadata that contains the actual text. Avoid technical jargon, do not make assumptions beyond the provided knowledge base, and give guidance in a simple, easy to understand way. When the building manager contacts you with an issue, engage them in a conversational dialogue asking questions to gather details about the problem. Use your knowledge base to analyze the symptoms and narrow down potential causes. Walk the manager step-by-step through diagnostic checks they can perform on site and determine if a technician needs to be called. Provide repair instructions if it is a minor fix. Throughout the conversation, explain your reasoning to build trust and understanding. Show empathy if the manager is frustrated. Your goal is to provide knowledgeable, conversational guidance to resolve issues as efficiently and effectively as possible."},
            {"role": AI_PROMPT, "content": "understood. Hello I am the Ferry building, running on BuildingBrain. How can I help you today?"},
            # {"role": AI_PROMPT, "content": "You are an experienced AC Repair technician. It is now your job to help answer questions for new AC repair technicians.You can answer questions about the AC Repair, troubleshooting, startup and more."},
            {"role": HUMAN_PROMPT, "content": "What is an AC Condenser?"},
            {"role": AI_PROMPT,
             "content": f"A condenser (or AC condenser) is the outdoor portion of an air conditioner or heat pump that either releases or collects heat, depending on the time of the year."},
        ]


        if (previous_message != None):
            init_messages.append(
                {"role": HUMAN_PROMPT, "content": f"{previous_message.get('userMessage', 'No previous message found.')}"},)
            init_messages.append(
                {"role": AI_PROMPT, "content": f"{previous_message.get('modelResponse', 'No previous model response found')}"},)



        # lets add the question and context to the init prompt
        init_messages.append(
            # {"role": "user", "content": f"Given the context: {context}, can you answer the question: {question}. Please format your response as html. Include image sources if you find image sources in the context. Please ensure that the HTML is formatted such that the text is on the right, and the image, if any, is on the left in a two column layout. Your response can have a maximum limit of {max_response_length} words. However if a response that is shorter than {max_response_length} words is available, please return that response."}
            {"role": "user", "content": f"Given the context: {context}, can you answer the question: {question}. Please format your response as HTML. Your response can have a maximum limit of {max_response_length} words. However if a response that is shorter than {max_response_length} words is available, please return that response. {AI_PROMPT}"}
        )

        init_messages_token_count = calculate_prompt_token_count(init_messages)

        pretty_print(
            f"Prompt + Context Token Count: {init_messages_token_count}")

        # Create a completions using the questin and context
        # response = openai.ChatCompletion.create(
        #     messages=init_messages,
        #     temperature=0,
        #     max_tokens=max_tokens,
        #     top_p=1,
        #     frequency_penalty=0,
        #     presence_penalty=0,
        #     stop=stop_sequence,
        #     model=model,
        # )

        init_messages = convert_messages_to_anthropic_format(init_messages)

        # Call the query_anthropic_model function
        response = query_anthropic_model(
            prompt=init_messages,
            # max_tokens_to_sample=max_tokens,
            max_tokens_to_sample=40000,
            temperature=0,
            top_p=1,
            presence_penalty=0,
            frequency_penalty=0,
        )

        response_token_count = calculate_response_token_count(response.completion.strip())
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
