import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import readline from "node:readline/promises";

dotenv.config();
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `you are the Smart assestant who answere the question.
           you are following these tool
           1 websearch({query}: {query:query}) //Serch the letest information from the web for the user and realtime information on internate 
           `,
    },
  ];

  while (true) {
    const question = await rl.question("You: ");
    if (question === "bye") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });
    while (true) {
      const res = await groq.chat.completions.create({
        temperature: 0,
        model: "llama-3.1-8b-instant",
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description:
                "Serch the letest information from the web for the user and realtime information on internate",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "the search Query to perform serach on ",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      messages.push(res.choices[0].message);

      const toolcall = res.choices[0].message.tool_calls;

      if (!toolcall) {
        console.log(`Assistant:${res.choices[0].message.content}`);
        break;
      }

      for (const tool of toolcall) {
        const toolName = tool.function.name;
        const toolArgs = tool.function.arguments;
        if (toolName === "webSearch") {
          const toolResult = await webSearch(JSON.parse(toolArgs));
          // console.log(`toolResult`, toolResult);

          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: toolName,
            content: toolResult,
          });
        }
      }
    }
  }
  rl.close();
}

main();

async function webSearch({ query }) {
  console.log("calling webSearch with query......:");
  const response = await tvly.search(query);
  // console.log("response", response);

  const finalresult = response.results
    .slice(0, 2) // sirf top 2 results
    .map((result) => result.content)
    .join("\n\n");
  // console.log("finalresult", finalresult);
  return finalresult;
}
