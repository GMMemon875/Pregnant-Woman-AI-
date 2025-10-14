import express from "express";
import { genrate } from "./chatgpt.js";
import cors from "cors";
const app = express();
const port = 3000;

// 🟢 Middleware for JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Well Come ChatGPT API");
});

app.post("/chat", async (req, res) => {
  const { message } = req.body || {};

  console.log("Message:", message);

  const result = await genrate(message);

  res.json({ message: result });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
