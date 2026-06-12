import express from "express";

const app = express();

app.get("/", async (req, res) => {

  try {

    const r = await fetch(
      "https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/autocompletaStazione/Brescia",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36"
        }
      }
    );

    const testo = await r.text();

    res.json({
      status: r.status,
      primi500: testo.substring(0, 500)
    });

  } catch (e) {

    res.json({
      errore: e.message
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server avviato");
});
