from langchain.chains.router import MultiPromptChain
from langchain.llms import OpenAI
from langchain.chains import ConversationChain
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.chains.router.llm_router import LLMRouterChain, RouterOutputParser
from langchain.chains.router.multi_prompt_prompt import MULTI_PROMPT_ROUTER_TEMPLATE
from langchain.chat_models import ChatAnthropic
# Define the templates
simple_template = [
  "Manager asks a direct factual or lookup question",
  "Requires checking just one component or parameter",
  "Can be resolved in 1-2 clear steps",
  "Instructions don't need technical knowledge"
]
complex_template = [
  "Vague description of issue without details",
  "Multiple equipment involved like HVAC and ductwork",
  "Troubleshooting requires checking many parameters",
  "In-depth knowledge of building systems required",
  "Repair requires hazmat handling or electrical lockout procedures"
]
# Define the prompts
prompt_infos = [
    {
        "name": "simple",
        "description": "tasks that can be addressed with the BuildingBrain AI in one or two steps",
        "prompt_template": simple_template,
    },
    {
        "name": "complex",
        "description": "complex tasks that require a few steps to reach a resolution",
        "prompt_template": complex_template,
    },
]
# Initialize the chat model
llm  = ChatAnthropic()
def initialize_chains():
    destination_chains = {}
    for p_info in prompt_infos:
        name = p_info["name"]
        prompt_template = p_info["prompt_template"]
        prompt = PromptTemplate(template=prompt_template, input_variables=["input"])
        chain = LLMChain(llm=llm, prompt=prompt)
        destination_chains[name] = chain
    default_chain = ConversationChain(llm=llm, output_key="text")
    destinations = [f"{p['name']}: {p['description']}" for p in prompt_infos]
    destinations_str = "\n".join(destinations)
    router_template = MULTI_PROMPT_ROUTER_TEMPLATE.format(destinations=destinations_str)
    router_prompt = PromptTemplate(
        template=router_template,
        input_variables=["input"],
        output_parser=RouterOutputParser(),
    )
    router_chain = LLMRouterChain.from_llm(llm, router_prompt)
    return destination_chains, default_chain, router_chain
destination_chains, default_chain, router_chain = initialize_chains()
# Main interaction loop
conversation_active = True
while conversation_active:
    user_prompt = input("How can BuildingBrain help you?")
    if user_prompt.lower() == 'quit':
        print('Ending conversation.')
        conversation_active = False
    else:
        # Initialize MultiPromptChain
        chain = MultiPromptChain(
            router_chain=router_chain,
            destination_chains=destination_chains,
            default_chain=default_chain,
            verbose=True,
        )
        # Fetch context from database
        retrieved_context = get_context_from_database(user_prompt)
        user_prompt += "\n This context may be helpful to answer the question:" + retrieved_context
        response = chain(chat_history)
        print(response)
