const express = require("express");
const fs = require("fs");
const XLSX = require("xlsx");

const app = express();
app.use(express.json());

// Configurazione percorsi (modificabili via API)
let config = {
  sourcePath: "C:\\Users\\marco\\OneDrive\\Desktop\\Test_CQ\\Tabellone_CQ.ods",
  destPath:
    "C:\\Users\\marco\\OneDrive\\Desktop\\Test_CQ\\Controlli_eseguiti.ods",
};

console.log(config.destPath);

// API 0: Configura i percorsi dei file
app.post("/api/config", (req, res) => {
  const { sourcePath, destPath } = req.body;

  if (sourcePath) {
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({
        error: "File sorgente non trovato",
        path: sourcePath,
      });
    }
    config.sourcePath = sourcePath;
  }

  if (destPath) {
    if (!fs.existsSync(destPath)) {
      return res.status(404).json({
        error: "File destinazione non trovato",
        path: destPath,
      });
    }
    config.destPath = destPath;
  }

  res.json({
    message: "Configurazione aggiornata",
    config: config,
  });
});

// API 1: Legge dati dal file sorgente
app.get("/api/read-source", async (req, res) => {
  try {
    const { disegno, commessa, quantita } = req.query;

    if (!disegno) {
      return res
        .status(400)
        .json({ error: "Il parametro disegno è obbligatorio" });
    }

    const workbook = XLSX.readFile(config.sourcePath);
    const sheetName = workbook.SheetNames[0]; // Prende il primo foglio
    const worksheet = workbook.Sheets[sheetName]; // Prende il foglio di lavoro
    const data = XLSX.utils.sheet_to_json(worksheet); // Converte il foglio in JSON

    let filtered = data;

    // Filtraggio per disegno
    filtered = filtered.filter(
      (row) => String(row.disegno) === String(disegno)
    );

    // Filtraggio per commessa
    if (filtered.length > 1 && commessa) {
      filtered = filtered.filter(
        (row) => String(row.commessa) === String(commessa)
      );
    }

    // Filtraggio per quantità
    if (filtered.length > 1 && quantita) {
      filtered = filtered.filter(
        (row) => String(row.quantita) === String(quantita)
      );
    }
    //Nessun dato trovato
    if (filtered.length === 0) {
      return res.status(404).json({ error: "Nessun dato trovato" });
    }

    //Più righe trovate
    if (filtered.length > 1) {
      return res.status(300).json({
        message:
          "Trovate più righe. Specificare ulteriori parametri (commessa o quantità)",
        data: filtered,
      });
    }

    res.json({ data: filtered[0] });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore del server", details: error.message });
  }
});

// API 2: Scrive nel file destinazione
app.post("/api/write-destination", async (req, res) => {
  try {
    const {
      cliente,
      commessa,
      assieme,
      descrizione_assieme,
      rif_ordine,
      disegno,
      desc_articolo,
      quantita,
      fornitore,
      stato,
      operatore,
    } = req.body;

    //console.log(req.body);

    // Verifica esistenza file destinazione
    if (!fs.existsSync(config.destPath)) {
      return res.status(404).json({
        error: "File destinazione non trovato",
        path: config.destPath,
      });
    }

    // Validazioni
    const operatoriValidi = ["Rugani", "Cencig", "Giovannelli"];
    const statiValidi = ["accepted", "rejected", "derogatory"];

    if (!operatore || !operatoriValidi.includes(operatore)) {
      return res.status(400).json({
        error:
          "Operatore non valido. Scegliere tra: Rugani, Cencig, Giovannelli",
      });
    }

    if (!stato || !statiValidi.includes(stato)) {
      return res.status(400).json({
        error:
          "Stato non valido. Scegliere tra: accepted, rejected, derogatory",
      });
    }

    // Legge il workbook esistente una sola volta
    const destWorkbook = XLSX.readFile(config.destPath);
    const destSheetName = destWorkbook.SheetNames[0];
    const existingData = XLSX.utils.sheet_to_json(
      destWorkbook.Sheets[destSheetName]
    );

    // Calcola il prossimo Nr_controllo
    let nextNrControllo = 1;
    if (existingData.length > 0) {
      const lastNr = Math.max(
        ...existingData.map((row) => parseInt(row.nr_controllo) || 0)
      );
      nextNrControllo = lastNr + 1;
    }

    // Prepara la nuova riga
    const today = new Date().toISOString().split("T")[0];
    const newRow = {
      nr_controllo: nextNrControllo,
      data: today,
      operatore: operatore,
      cliente: cliente,
      disegno: disegno,
      quantita: quantita,
      rif_ordine: rif_ordine,
      fornitore: fornitore,
      commessa: commessa,
      stato: stato,
      disegnatore: "/",
      note: "/",
    };

    // Aggiungi la nuova riga e aggiorna il foglio
    existingData.push(newRow);
    destWorkbook.Sheets[destSheetName] = XLSX.utils.json_to_sheet(existingData);

    // Salva il file
    XLSX.writeFile(destWorkbook, config.destPath);

    res.json({
      message: "Controllo registrato con successo",
      data: newRow,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore del server", details: error.message });
  }
});

//capire come fare la formattazione uguale alle righe precedenti,
//poi collegare questa api a quella di get

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});

// // Verifica esistenza file sorgente
// console.log("=== VERIFICA FILE ===");
// console.log("Percorso file sorgente:", SOURCE_PATH);
// console.log("File esiste?", fs.existsSync(SOURCE_PATH));

// // Lettura dati dal file sorgente per prova
// if (fs.existsSync(SOURCE_PATH)) {
//   console.log("\n=== LETTURA DATI FILE SORGENTE ===");
//   try {
//     const workbook = XLSX.readFile(SOURCE_PATH);
//     const sheetName = workbook.SheetNames[0]; // Prende il primo foglio
//     const worksheet = workbook.Sheets[sheetName]; // Prende il foglio di lavoro
//     //console.log(worksheet); // ritorna tutti i dati sul foglio

//     const data = XLSX.utils.sheet_to_json(worksheet); // Converte il foglio in JSON

//     console.log("Numero righe:", data.length);
//     console.log("Prima riga:", data[0]);
//     console.log("Nomi delle colonne:", Object.keys(data[0]));
//     console.log("=== FINE LETTURA ===\n");
//   } catch (error) {
//     console.error("Errore lettura file:", error.message);
//   }
// } else {
//   console.error("ATTENZIONE: Il file sorgente non esiste!");
// }

/*POST /api/config - Imposta i percorsi

{
  "sourcePath": "C:\\nuova\\path\\sorgente.ods",
  "destPath": "C:\\nuova\\path\\destinazione.ods"
} */

/*
GET
http://localhost:3000/api/read-source?disegno=369865&quantita=2
*/

/*
POST
{
        "operatore" : "Cencig",
        "stato" : "accepted",
        "cliente": "Sofidel",
        "commessa": 456374,
        "assieme": "0364578",
        "descrizione_assieme": "/",
        "rif_ordine": 145689,
        "disegno": 369865,
        "descr_art": "perno",
        "quantita": 4,
        "fornitore": "deda"
}*/
