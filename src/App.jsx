import { useState } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'
// ============================================================
// CONSTANTES (SCREAMING_SNAKE_CASE)
// ============================================================
const API_URL = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"
const MAX_TOKENS = 1000

const DOMAINES = ["Mathématiques", "Informatique", "Histoire", "Sciences", "Langues", "Autre"]
const BUTS = ["Recherche", "Révision", "Quête de connaissance"]
const NIVEAUX = ["Débutant", "Intermédiaire", "Avancé", "Expert"]
const TEMPS_OPTIONS = ["15 minutes", "30 minutes", "1 heure", "2 heures", "3 heures et plus"]

// ============================================================
// COMPOSANT — Sélecteur de pills
// ============================================================
function PillSelector({ options, valeur_selectionnee, on_select }) {
  return (
    <div className="pill-group">
      {options.map((option) => (
        <button
          key={option}
          className={`pill ${valeur_selectionnee === option ? 'pill--active' : ''}`}
          onClick={() => on_select(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}

// ============================================================
// COMPOSANT — Carte de section
// ============================================================
function SectionCard({ numero, titre, children }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-numero">{numero}</span>
        <h2 className="section-titre">{titre}</h2>
      </div>
      <div className="section-body">
        {children}
      </div>
    </div>
  )
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
function App() {

  // --- Variables du formulaire (snake_case) ---
  const [domaine, set_domaine] = useState("")
  const [but, set_but] = useState("")
  const [specification, set_specification] = useState("")
  const [niveau, set_niveau] = useState("")
  const [temps_dispo, set_temps_dispo] = useState("")

  // --- Variables de l'application ---
  const [reponse, set_reponse] = useState("")
  const [est_en_chargement, set_est_en_chargement] = useState(false)
  const [erreur, set_erreur] = useState("")

  function construire_prompt() {
    return `Tu es un assistant pédagogique expert. Génère un plan d'apprentissage personnalisé.

INFORMATIONS DE L'ÉTUDIANT :
- Domaine : ${domaine}
- But : ${but}
- Spécification : ${specification}
- Niveau actuel : ${niveau}
- Temps disponible : ${temps_dispo}

Génère un plan d'apprentissage structuré, clair et adapté à ces informations.
Inclus : les étapes clés, les ressources recommandées, et des conseils pratiques.`
  }

  async function generer_plan() {
    if (!domaine || !but || !specification || !niveau || !temps_dispo) {
      set_erreur("Veuillez remplir tous les champs avant de générer.")
      return
    }
    set_erreur("")
    set_est_en_chargement(true)
    set_reponse("")

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: "user", content: construire_prompt() }]
        })
      })
      const data = await response.json()
      if (data.error) { set_erreur("Erreur API : " + data.error.message); return }
      set_reponse(data.content[0].text)
    } catch (err) {
      set_erreur("Erreur de connexion : " + err.message)
    } finally {
      set_est_en_chargement(false)
    }
  }

  const champs_remplis = [domaine, but, specification, niveau, temps_dispo].filter(Boolean).length
  const progression = (champs_remplis / 5) * 100

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="container">

        <header className="header">
          <div className="header-badge">IA · Apprentissage personnalisé</div>
          <h1 className="header-titre">Study<span className="accent">Homie</span></h1>
          <p className="header-sous-titre">
            Dis-moi ce que tu veux apprendre. Je te donne le meilleur plan selon tes disponibilités.
          </p>
        </header>

        <div className="progression-container">
          <div className="progression-texte">
            <span>{champs_remplis}/5 sections complétées</span>
            <span>{Math.round(progression)}%</span>
          </div>
          <div className="progression-barre">
            <div className="progression-fill" style={{ width: `${progression}%` }} />
          </div>
        </div>

        <div className="formulaire">

          <SectionCard numero="01" titre="Le Domaine">
            <p className="champ-label">Dans quel domaine veux-tu progresser?</p>
            <PillSelector options={DOMAINES} valeur_selectionnee={domaine} on_select={set_domaine} />
          </SectionCard>

          <SectionCard numero="02" titre="Ton But">
            <p className="champ-label">Quel est ton objectif principal?</p>
            <PillSelector options={BUTS} valeur_selectionnee={but} on_select={set_but} />
          </SectionCard>

          <SectionCard numero="03" titre="Ta Spécification">
            <p className="champ-label">Décris précisément ce que tu veux apprendre</p>
            <textarea
              className="textarea"
              placeholder="Ex: Je veux comprendre les hooks React, surtout useState et useEffect..."
              value={specification}
              onChange={(e) => set_specification(e.target.value)}
              rows={4}
            />
            <span className="caracteres">{specification.length} caractères</span>
          </SectionCard>

          <SectionCard numero="04" titre="Ton Niveau">
            <p className="champ-label">Où en es-tu actuellement?</p>
            <PillSelector options={NIVEAUX} valeur_selectionnee={niveau} on_select={set_niveau} />
          </SectionCard>

          <SectionCard numero="05" titre="Temps Disponible">
            <p className="champ-label">Combien de temps as-tu devant toi?</p>
            <PillSelector options={TEMPS_OPTIONS} valeur_selectionnee={temps_dispo} on_select={set_temps_dispo} />
          </SectionCard>

        </div>

        {erreur && <div className="erreur">⚠️ {erreur}</div>}

        <button
          className={`btn-generer ${est_en_chargement ? 'btn-generer--loading' : ''}`}
          onClick={generer_plan}
          disabled={est_en_chargement}
        >
          {est_en_chargement
            ? <><span className="spinner" /> Génération en cours...</>
            : <>✦ Générer mon SUPEEEEEEEEEEER plan d'étude </>
          }
        </button>

        {reponse && (
          <div className="reponse-container">
            <div className="reponse-header">
              <span className="reponse-badge">✦ SUPEEEEEEEEER plan structuré généré</span>
              <h2 className="reponse-titre">Ton Super Plan:</h2>
            </div>
            <div className="reponse-contenu">
              <ReactMarkdown>{reponse}</ReactMarkdown>
              </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App