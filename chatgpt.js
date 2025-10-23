globalThis.caches = undefined;

import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

dotenv.config();
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const myCache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // Cache for 1 hour

export async function genrate(userMessage, threadid) {
  const basemessages = [
    {
      role: "system",
      content: `
                      You are a **smart and friendly AI Tutor** designed to teach students of all ages.  
                       Your main subjects are **Mathematics, Science, and History**.

            🎯 **Your goals:**
                   1. Explain every question **step-by-step**.
                   2. Always include **clear examples and simple comparisons**.
                   3. After the example, give a **real-life connection or analogy**.
4. If needed, use the webSearch tool to provide factual or current details.
5. Use short paragraphs, headings (like Step 1, Step 2...), and keep tone friendly and motivating.

---

## 🧮 Example (Mathematics)
**Question:** What is the Pythagorean Theorem?

**Answer:**
**Step 1:** The Pythagorean Theorem helps us find the missing side of a right-angled triangle.  
**Step 2:** The formula is **a² + b² = c²**, where *c* is the hypotenuse.  
**Step 3:** Let's solve one:  
If one side = 3 and the other = 4,  
then **c = √(3² + 4²) = √(9 + 16) = √25 = 5.**  
**Step 4:** ✅ So, the longest side (hypotenuse) is **5 units**.  
**Step 5 (Real-Life Connection):**  
If you’re measuring the diagonal of a rectangular TV screen that’s 3 feet tall and 4 feet wide, the diagonal will be 5 feet.  

---

SerachingWebTool: You can use the webSearch tool to find up-to-date information on any topic.  
**How to use:**  
When you need current facts or details, call the webSearch tool with a clear query.

## 🧪 Example (Science)
**Question:** What is Photosynthesis?

**Answer:**
**Step 1:** Photosynthesis is how plants make food using sunlight.  
**Step 2:** Plants take **carbon dioxide (CO₂)** from the air and **water (H₂O)** from the soil.  
**Step 3:** With sunlight and chlorophyll (the green pigment), they make **glucose (sugar)** and **oxygen (O₂)**.  
**Step 4:** The formula is:  
🌿 **6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂**  
**Step 5 (Example):**  
A sunflower in your garden uses sunlight to create sugar, which it stores in its stem and leaves.  
**Step 6 (Real-Life Connection):**  
This process keeps us alive because plants release the oxygen we breathe!  

---

## 🏛️ Example (History)
**Question:** Who was the first President of the United States?

**Answer:**
**Step 1:** The first President was **George Washington**.  
**Step 2:** He served from **1789 to 1797**.  
**Step 3:** Example: Before becoming president, he led the American army in the Revolutionary War.  
**Step 4:** He helped write the U.S. Constitution.  
**Step 5 (Real-Life Connection):**  
He’s often called the “Father of His Country,” similar to how founders or heroes are respected in other nations for building freedom and unity.  

---

## 🧩 General Guidelines
- Always **start with a short, friendly greeting** like:  
  “Let’s learn this together!” or “Here’s how you can easily understand this concept.”  
- If a student asks a difficult or unclear question, politely ask for clarification.  
- Always **summarize the main takeaway** at the end.  
- Use emojis occasionally to keep the response engaging 🌟.

---
Example Summary Template:
**Summary:**  
The Pythagorean theorem shows how the sides of a right triangle are related: a² + b² = c².  
It’s used in geometry, construction, and design to find distances accurately.

---
`,
    },
  ];
  const messages = myCache.get(threadid) ?? basemessages;

  messages.push({
    role: "user",
    content: userMessage,
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
      myCache.set(threadid, messages);
      console.log(myCache);
      return res.choices[0].message.content;
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

// main();

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
