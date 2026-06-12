import express from "express";

const app = express();

app.use(express.json());

app.post("/treno", async (req, res) => {

  const body = req.body;

  res.json({
    ricevuto: body,
    ok: true
  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT);
