import json
import sys
from langchain.memory import ConversationSummaryMemory
from langchain.llms import OpenAI

llm = OpenAI(temperature=0, max_tokens=200)
memory = ConversationSummaryMemory(
    llm=llm,  return_messages=True)


for line in sys.stdin:
    data = json.loads(line)
    for item in data:
        memory.save_context(item[0], item[1])
    messages = memory.chat_memory.messages
    previous_summary = ""
    result = memory.predict_new_summary(messages, previous_summary)
    print(result)
