import express from "express";
const app = express();
app.use(express.json());
app.post("/treno", async (req, res) => {
try {
  const body = req.body;
  let input = (body.input || "").trim();
if (/^[0-9\s.,]+$/.test(input)) {

  input = input.replace(/[^\d]/g, "");
}
  const destinazione = (body.destinazione || "").trim();
async function vtFetch(url) {
  return fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language":
        "it-IT,it;q=0.9",
      "Cache-Control":
        "no-cache",
      "Pragma":
        "no-cache",
      "Referer":
        "https://www.viaggiatreno.it/",
      "Origin":
        "https://www.viaggiatreno.it"
    }
  });
}
  // ==========================
  // MODALITA' A - NUMERO TRENO + STAZIONE
  // ==========================
  if (/^\d+$/.test(input)) {

    const stazione = (body.stazione || "").trim();

    if (!stazione) {

      return res.json({
        risposta: "Stazione non specificata."
      });
    }

    const r1 = await vtFetch(
      `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/cercaNumeroTreno/${input}`
    );

    if (!r1.ok) {

      return res.json({
        risposta: `Non riesco a trovare il treno ${input}.`
      });
    }

    const dati1 = await r1.json();

    if (!dati1 || !dati1.codLocOrig) {

      return res.json({
        risposta: `Treno ${input} non trovato.`
      });
    }

    const codLocOrig = dati1.codLocOrig;
    const millis = dati1.millisDataPartenza;

    const r2 = await vtFetch(
      `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/andamentoTreno/${codLocOrig}/${input}/${millis}`
    );

    if (!r2.ok) {

      return res.json({
        risposta: `Non riesco a recuperare i dettagli del treno ${input}.`
      });
    }

    const dati2 = await r2.json();

    const rTratte = await vtFetch(
      `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/tratteCanvas/${codLocOrig}/${input}/${millis}`
    );

    if (!rTratte.ok) {

      return res.json({
        risposta: `Non riesco a recuperare le fermate del treno ${input}.`
      });
    }

    const fermate = await rTratte.json();

    const stazioneRicercata =
      stazione
        .trim()
        .toUpperCase();

    const fermata = fermate.find(
      f =>
        f.stazione &&
        (
          f.stazione
            .trim()
            .toUpperCase()
            .includes(stazioneRicercata)
          ||
          stazioneRicercata.includes(
            f.stazione
              .trim()
              .toUpperCase()
          )
        )
    );
      
    if (!fermata) {

      return res.json({
        risposta:
          `Il treno ${input} non effettua fermata a ${stazione}.`
      });
    }

    const arrivo =
  fermata.fermata?.arrivo_teorico
    ? new Intl.DateTimeFormat(
        "it-IT",
        {
          timeZone: "Europe/Rome",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }
      ).format(
        new Date(
          fermata.fermata.arrivo_teorico
        )
      )
    : "non disponibile";

const partenza =
  fermata.fermata?.partenza_teorica
    ? new Intl.DateTimeFormat(
        "it-IT",
        {
          timeZone: "Europe/Rome",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }
      ).format(
        new Date(
          fermata.fermata.partenza_teorica
        )
      )
    : "non disponibile";

    const binario =
  fermata.fermata?.binarioEffettivoPartenzaDescrizione ||
  fermata.fermata?.binarioProgrammatoPartenzaDescrizione ||
  fermata.fermata?.binarioEffettivoArrivoDescrizione ||
  fermata.fermata?.binarioProgrammatoArrivoDescrizione ||
  "non disponibile";

	
    const ritardo =
      fermata.ritardoPartenza ??
      fermata.ritardoArrivo ??
      dati2.ritardo ??
      0;
const ritardoVisualizzato =
  ritardo <= 0 ? 0 : ritardo;
let arrivoFinale = arrivo;
let partenzaFinale = partenza;
let binarioFinale = binario;

if (
  !partenzaFinale ||
  partenzaFinale === "non disponibile" ||
  !binarioFinale ||
  binarioFinale === "non disponibile"
) {
  const rAuto = await vtFetch(
    `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/autocompletaStazione/${encodeURIComponent(stazione)}`
  );

  const testoAuto = await rAuto.text();

  if (testoAuto) {

    const primaRigaAuto = testoAuto.split("\n")[0];

    if (primaRigaAuto) {

      const codiceStazioneFallback =
        primaRigaAuto.split("|")[1];

      if (codiceStazioneFallback) {

        const dataOra = new Date().toString();

        const rPartenze = await vtFetch(
          `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${codiceStazioneFallback}/${encodeURIComponent(dataOra)}`
        );

        if (rPartenze.ok) {

          const partenzeFallback =
            await rPartenze.json();
          
          const trenoFallback =
  partenzeFallback.find(
    t =>
      String(t.numeroTreno).trim() ===
      String(input).trim()
  );


          if (trenoFallback) {

  if (
    !partenzaFinale ||
    partenzaFinale === "non disponibile"
  ) {
    partenzaFinale =
      trenoFallback.compOrarioPartenza;
  }

  if (
    !binarioFinale ||
    binarioFinale === "non disponibile"
  ) {

    binarioFinale =
      trenoFallback.binarioEffettivoPartenzaDescrizione ||
      trenoFallback.binarioProgrammatoPartenzaDescrizione ||
      null;
            }
          }
        }
      }
    }
  }
}

arrivoFinale =
  arrivoFinale || "non disponibile";

partenzaFinale =
  partenzaFinale || "non disponibile";

binarioFinale =
  binarioFinale || "non disponibile";
   let risposta;
   const origineTreno =
  (dati2.origine || "")
    .trim()
    .toUpperCase();

const stazioneRichiesta =
  (fermata.stazione || "")
    .trim()
    .toUpperCase();

const destinazioneTreno =
  (dati2.destinazione || "")
    .trim()
    .toUpperCase();
if (origineTreno === stazioneRichiesta) {
  risposta =
    `Il treno numero ${input} diretto a ${dati2.destinazione} ` +
    `è previsto in partenza da ${dati2.origine} alle ore ${partenzaFinale} ` +
    `dal binario ${binarioFinale}. ` +
    `Al momento il treno ha un ritardo di ${ritardoVisualizzato} minuti.`;
} else if (destinazioneTreno === stazioneRichiesta) {
const arrivato =
  fermata.fermata?.effettiva;
  if (arrivato) {
    const oraArrivo =
      new Date(arrivato)
        .toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit"
        });
    risposta =
      `Il treno numero ${input}, proveniente da ${dati2.origine}, ` +
      `è già arrivato a ${fermata.stazione} alle ore ${oraArrivo} ` +
      `al binario ${binarioFinale}.`;
  } else {
    risposta =
      `Il treno numero ${input}, proveniente da ${dati2.origine}, ` +
      `è previsto in arrivo a ${fermata.stazione} alle ore ${arrivoFinale} ` +
      `al binario ${binarioFinale}. ` +
      `Al momento il treno ha un ritardo di ${ritardoVisualizzato} minuti.`;
  }
} else {
  risposta =
    `Il treno numero ${input}, proveniente da ${dati2.origine} e diretto a ${dati2.destinazione}, ` +
    `effettua fermata a ${fermata.stazione}. ` +
    `La partenza da ${fermata.stazione} è prevista alle ore ${partenzaFinale} ` +
    `dal binario ${binarioFinale}. ` +
    `Al momento il treno ha un ritardo di ${ritardoVisualizzato} minuti.`;
}

    return res.json({
      risposta
    });
  }

  // =========================================
  // MODALITA' B - STAZIONE -> DESTINAZIONE
  // =========================================

  if (!destinazione) {

    return res.json({
      risposta: "Destinazione non specificata."
    });
  }

const r3 = await vtFetch(
  `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/autocompletaStazione/${encodeURIComponent(input)}`
);

const testo = await r3.text();

if (!testo) {
  return res.json({
    risposta: `Non trovo la stazione ${input}.`
  });
}

const primaRiga = testo.split("\n")[0];

if (!primaRiga) {
  return res.json({
    risposta: `Non trovo la stazione ${input}.`
  });
}


  const codiceStazione = primaRiga.split("|")[1];

  if (!codiceStazione) {
    return res.json({
      risposta: `Codice stazione non trovato per ${input}.`
    });
  }

  const dataOra = new Date().toString();

  const r4 = await vtFetch(
    `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${codiceStazione}/${encodeURIComponent(dataOra)}`
  );

  const partenze = await r4.json();

  let trovato = null;

  const destinazioneRicercata =
    destinazione
      .trim()
      .toUpperCase();

  for (const treno of partenze) {

    try {
          const oraPartenza = treno.compOrarioPartenza;
    if (oraPartenza) {
      const [ore, minuti] =
        oraPartenza.split(":").map(Number);
      const adesso = new Date();
      const dataTreno = new Date();
      dataTreno.setHours(
        ore,
        minuti,
        0,
        0
      );
      // ignora i treni già partiti
      if (dataTreno < adesso) {
        continue;
      }
    }
      const rNumero = await vtFetch(
        `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/cercaNumeroTreno/${treno.numeroTreno}`
      );

      if (!rNumero.ok) {
        continue;
      }

      const datiNumero = await rNumero.json();

      if (!datiNumero || !datiNumero.codLocOrig) {
        continue;
      }

      const rTratte = await vtFetch(
        `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/tratteCanvas/${datiNumero.codLocOrig}/${treno.numeroTreno}/${datiNumero.millisDataPartenza}`
      );

      if (!rTratte.ok) {
        continue;
      }

      const fermateTreno = await rTratte.json();

      const indicePartenza = fermateTreno.findIndex(
  f =>
    f.stazione &&
    (
      f.stazione
        .trim()
        .toUpperCase()
        .includes(input.trim().toUpperCase())
      ||
      input
        .trim()
        .toUpperCase()
        .includes(
          f.stazione
            .trim()
            .toUpperCase()
        )
    )
);

const indiceDestinazione = fermateTreno.findIndex(
  f =>
    f.stazione &&
    (
      f.stazione
        .trim()
        .toUpperCase()
        .includes(destinazioneRicercata)
      ||
      destinazioneRicercata.includes(
        f.stazione
          .trim()
          .toUpperCase()
      )
    )
);
if (
  indicePartenza !== -1 &&
  indiceDestinazione !== -1 &&
  indiceDestinazione > indicePartenza
) {

  const fermataPartenza =
    fermateTreno[indicePartenza];

  const adesso = new Date();

  if (fermataPartenza.partenzaReale) {
    continue;
  }

  if (fermataPartenza.partenza_teorica) {

    const dataPartenza =
      new Date(
        fermataPartenza.partenza_teorica
      );

    if (dataPartenza <= adesso) {
      continue;
    }
  }

  trovato = treno;
  break;
}


    } catch (e) {
      continue;
    }
  }

  if (!trovato) {

    return res.json({
      risposta:
        `Non ho trovato partenze per ${destinazione} da ${input}.`
    });
  }

  const binario =
    trovato.binarioEffettivoPartenzaDescrizione ||
    trovato.binarioProgrammatoPartenzaDescrizione ||
    "non disponibile";

  const rNumeroFinale = await vtFetch(
  `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/cercaNumeroTreno/${trovato.numeroTreno}`
);

const datiNumeroFinale = await rNumeroFinale.json();
const rAndamentoFinale = await vtFetch(
  `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/andamentoTreno/${datiNumeroFinale.codLocOrig}/${trovato.numeroTreno}/${datiNumeroFinale.millisDataPartenza}`
);

const datiAndamentoFinale = await rAndamentoFinale.json();

const rTratteFinale = await vtFetch(
  `https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/tratteCanvas/${datiNumeroFinale.codLocOrig}/${trovato.numeroTreno}/${datiNumeroFinale.millisDataPartenza}`
);

const fermateFinali = await rTratteFinale.json();

const fermataPartenza = fermateFinali.find(
  f =>
    f.stazione &&
    (
      f.stazione
        .trim()
        .toUpperCase()
        .includes(input.trim().toUpperCase())
      ||
      input
        .trim()
        .toUpperCase()
        .includes(
          f.stazione
            .trim()
            .toUpperCase()
        )
    )
);

const arrivo =
  fermataPartenza?.arrivo_teorico
    ? new Date(fermataPartenza.arrivo_teorico)
        .toLocaleTimeString("it-IT", {
          timeZone: "Europe/Rome",
          hour: "2-digit",
          minute: "2-digit"
        })
    : "non disponibile";

const partenza =
  fermataPartenza?.partenza_teorica
    ? new Date(fermataPartenza.partenza_teorica)
        .toLocaleTimeString("it-IT", {
          timeZone: "Europe/Rome",
          hour: "2-digit",
          minute: "2-digit"
        })
    : trovato.compOrarioPartenza;

let risposta;

const origineTreno =
  (datiAndamentoFinale.origine || "")
    .trim()
    .toUpperCase();

const stazionePartenzaRichiesta =
  input
    .trim()
    .toUpperCase();

const ritardoVisualizzato =
  (trovato.ritardo ?? 0) < 0
    ? 0
    : (trovato.ritardo ?? 0);
if (origineTreno === stazionePartenzaRichiesta) {

  risposta =
    `Il primo treno trovato è il treno numero ${trovato.numeroTreno} ` +
    `diretto a ${datiAndamentoFinale.destinazione}. ` +
    `La partenza da ${datiAndamentoFinale.origine} è prevista alle ore ${partenza} ` +
    `dal binario ${binario}. ` +
    `Al momento ha un ritardo di ${ritardoVisualizzato} minuti.`;

} else {

  risposta =
    `Il primo treno trovato è il treno numero ${trovato.numeroTreno}, ` +
    `proveniente da ${datiAndamentoFinale.origine} ` +
    `e diretto a ${datiAndamentoFinale.destinazione}. ` +
    `È previsto in partenza da ${stazionePartenzaRichiesta}  alle ore ${partenza} ` +
    `dal binario ${binario}. ` +
    `Al momento ha un ritardo di ${ritardoVisualizzato} minuti.`;
}

  return res.json({
    risposta
  });

} catch (errore) {

  return res.json({
    risposta: `Errore: ${errore.message}`
  });
}

});
app.get("/", (req, res) => {
  res.json({
    servizio: "Info Treni",
    stato: "OK"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server avviato");
});

