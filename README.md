# API Quality Control Automation

## Installazione

```bash
npm install
```

## Avvio

```bash
npm start
```

Il server sarà disponibile su `http://localhost:3000`

## API Disponibili

### 1. GET /api/read-source
Legge dati dal CSV sorgente con filtraggio progressivo

**Parametri query:**
- `disegno` (obbligatorio): numero disegno
- `commessa` (opzionale): numero commessa
- `quantita` (opzionale): quantità

**Esempio:**
```
GET http://localhost:3000/api/read-source?disegno=DIS001&commessa=COM123&quantita=10
```

**Risposta successo:**
```json
{
  "data": {
    "cliente": "...",
    "commessa": "...",
    "disegno": "...",
    ...
  }
}
```

### 2. POST /api/write-destination
Scrive una nuova riga nel CSV destinazione

**Body JSON:**
```json
{
  "operatore": "Rugani",
  "disegno": "DIS001",
  "commessa": "COM123",
  "quantita": "10",
  "stato": "accepted"
}
```

**Campi:**
- `operatore`: Rugani, Cencig o Giovannelli
- `disegno`: numero disegno (obbligatorio)
- `commessa`: numero commessa (opzionale, per filtraggio)
- `quantita`: quantità (opzionale, per filtraggio)
- `stato`: accepted, rejected o derogatory

**Risposta successo:**
```json
{
  "message": "Controllo registrato con successo",
  "data": {
    "Nr_controllo": 1,
    "data": "2026-01-12",
    "operatore": "Rugani",
    ...
  }
}
```
