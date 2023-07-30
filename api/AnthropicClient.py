# from langchain.chat_models import ChatAnthropic  
# from langchain.prompts.chat import (  
#     ChatPromptTemplate,  
#     SystemMessagePromptTemplate,  
#     AIMessagePromptTemplate,  
#     HumanMessagePromptTemplate,  
# )  

from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT



# from langchain.schema import AIMessage, HumanMessage, SystemMessage  

def query_anthropic_model(prompt, max_tokens_to_sample=500, temperature=0.5, top_p=1.0, seed=None, stop=None, presence_penalty=0.0, frequency_penalty=0.0):
    # Check if the prompt is a list or a tuple
    if isinstance(prompt, (list, tuple)):
        # If it is, join the elements into a single string separated by new lines
        prompt = '\n'.join(prompt)
    # If the prompt is not a string at this point, raise an error
    elif not isinstance(prompt, str):
        raise ValueError("Prompt must be a string or a list/tuple of strings.")

    anthropic = Anthropic()
    completion = anthropic.completions.create(
        model="claude-2",
        max_tokens_to_sample=max_tokens_to_sample,
        temperature=temperature,
        top_p=top_p,
        seed=seed,
        stop=stop,
        presence_penalty=presence_penalty,
        frequency_penalty=frequency_penalty,
        prompt=prompt,
    )
    print(completion.completion)

