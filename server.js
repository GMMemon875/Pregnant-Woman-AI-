import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Well Come ChatGPT API");
});

app.post("/chat", (req, res) => {
  const { message } = req.body;

  //   console.log("Message", message);
  res.json({ message: "Hello from server" });
  console.log("Message", message);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
