// ─── État du jeu ───────────────────────────────────────────────────────────
let mancheActive = null;
let questionIndex = 0;
let reponsesJoueur = [];
let scoresPartie = [];
let paliersPartie = [];
let modeArchive = false;
let donneesJoueur = null;

// ─── Constantes ────────────────────────────────────────────────────────────
const PALIERS = [
  { id: 'bullseye', label: 'Bullseye !',          emoji: '🎯', seuil: 0.045, couleur: '#1D9E75' },
  { id: 'proche',   label: 'Très proche',          emoji: '🔥', seuil: 0.18,  couleur: '#D85A30' },
  { id: 'ordre',    label: 'Bon ordre de grandeur', emoji: '👌', seuil: 0.31,  couleur: '#2B4FD8' },
  { id: 'loin',     label: 'Loin du compte',        emoji: '😬', seuil: 1.0,   couleur: '#E24B4A' },
  { id: 'planete',  label: 'Autre planète',         emoji: '🚀', seuil: Infinity, couleur: '#E24B4A' }
];

// ─── Utilitaires slider logarithmique ───────────────────────────────────────
function sliderVerValeur(t, min, max) {
  return Math.pow(10, Math.log10(min) + t * (Math.log10(max) - Math.log10(min)));
}

function valeurVersSlider(v, min, max) {
  return (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
}

function arrondir(v) {
  if (v < 1000)  return Math.round(v);
  if (v < 10000) return Math.round(v / 10) * 10;
  return Math.round(v / 100) * 100;
}

function formaterNombre(n) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

// ─── Scoring ────────────────────────────────────────────────────────────────
function calculerScore(reponseJoueur, verite) {
  const d = Math.abs(Math.log10(reponseJoueur / verite));
  return Math.max(0, Math.round(100 - 100 * d / 0.7));
}

function calculerPalier(reponseJoueur, verite) {
  const d = Math.abs(Math.log10(reponseJoueur / verite));
  return PALIERS.find(p => d <= p.seuil);
}

// ─── Partage ────────────────────────────────────────────────────────────────
function construireTextePartage(numManche, scores, paliers, streak) {
  const total = scores.reduce((a, b) => a + b, 0);
  const emojis = paliers.map(p => PALIERS.find(x => x.id === p)?.emoji || '?').join('');
  let texte = `EstimeLe #${numManche} — ${emojis} ${total}/300`;
  if (streak >= 3) texte += ` — streak ${streak} j`;
  texte += ` — estimele.fr`;
  return texte;
}

async function partager(texte) {
  try {
    await navigator.clipboard.writeText(texte);
    afficherNotification('Résultat copié !');
  } catch {
    if (navigator.share) {
      navigator.share({ text: texte });
    } else {
      afficherNotification('Copiez manuellement : ' + texte, true);
    }
  }
}

function afficherNotification(msg, longue = false) {
  const el = document.getElementById('notification');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), longue ? 4000 : 2000);
}

// ─── Initialisation ─────────────────────────────────────────────────────────
async function initialiserJeu(numMancheArchive = null) {
  donneesJoueur = chargerDonnees();

  let manche;
  if (numMancheArchive !== null) {
    manche = await getMancheParNumero(numMancheArchive);
    modeArchive = true;
  } else {
    manche = await getMancheDuJour();
    modeArchive = false;
  }

  if (!manche) {
    document.getElementById('ecran-jeu').innerHTML = '<p class="erreur">Manche introuvable.</p>';
    return;
  }

  mancheActive = manche;

  // Vérifier si déjà joué aujourd'hui (mode normal uniquement)
  if (!modeArchive && aDejaJoueAujourdhui(donneesJoueur, manche.numero)) {
    const resultat = getResultatDuJour(donneesJoueur, manche.numero);
    afficherResultatFinal(resultat.scores, resultat.paliers);
    return;
  }

  // Reprendre une partie en cours
  if (!modeArchive && donneesJoueur.partie_en_cours?.manche === manche.numero) {
    questionIndex = donneesJoueur.partie_en_cours.question_courante;
    reponsesJoueur = [...donneesJoueur.partie_en_cours.reponses];
  } else {
    questionIndex = 0;
    reponsesJoueur = [];
    scoresPartie = [];
    paliersPartie = [];
  }

  afficherQuestion();
}

// ─── Affichage question ──────────────────────────────────────────────────────
function afficherQuestion() {
  const q = mancheActive.questions[questionIndex];
  const container = document.getElementById('ecran-jeu');

  const valeurInitiale = Math.sqrt(q.borne_min * q.borne_max);
  const tInitial = valeurVersSlider(valeurInitiale, q.borne_min, q.borne_max);

  container.innerHTML = `
    <div class="question-header">
      <div class="numero-manche">EstimeLe #${mancheActive.numero}${modeArchive ? ' <span class="badge-archive">Archive</span>' : ''}</div>
      <div class="progression">Question ${questionIndex + 1}/3</div>
      ${!modeArchive ? `<div class="streak"><span class="flamme">🔥</span> ${donneesJoueur.streak_actuel} j</div>` : ''}
    </div>

    <div class="question-corps">
      <p class="question-texte">${q.question}</p>

      <div class="valeur-affichee" id="valeur-affichee">
        ${formaterNombre(arrondir(valeurInitiale))} <span class="unite">${q.unite}</span>
      </div>

      <div class="slider-container">
        <span class="borne-label">${formaterNombre(q.borne_min)}</span>
        <input
          type="range"
          id="curseur"
          min="0"
          max="10000"
          value="${Math.round(tInitial * 10000)}"
          class="curseur-log"
          aria-label="Votre estimation"
        />
        <span class="borne-label">${formaterNombre(q.borne_max)}</span>
      </div>
    </div>

    <button class="btn-valider" id="btn-valider" onclick="validerReponse()">
      Valider ma réponse
    </button>
  `;

  const curseur = document.getElementById('curseur');
  const affichage = document.getElementById('valeur-affichee');

  curseur.addEventListener('input', () => {
    const t = curseur.value / 10000;
    const v = arrondir(sliderVerValeur(t, q.borne_min, q.borne_max));
    affichage.innerHTML = `${formaterNombre(v)} <span class="unite">${q.unite}</span>`;
  });

  // Sauvegarder la partie en cours
  if (!modeArchive) {
    donneesJoueur.partie_en_cours = {
      manche: mancheActive.numero,
      question_courante: questionIndex,
      reponses: [...reponsesJoueur]
    };
    sauvegarderDonnees(donneesJoueur);
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────
function validerReponse() {
  const curseur = document.getElementById('curseur');
  const q = mancheActive.questions[questionIndex];
  const t = curseur.value / 1000;
  const reponse = arrondir(sliderVerValeur(t, q.borne_min, q.borne_max));

  const score = calculerScore(reponse, q.reponse);
  const palier = calculerPalier(reponse, q.reponse);

  reponsesJoueur.push(reponse);
  scoresPartie.push(score);
  paliersPartie.push(palier.id);

  afficherRevelation(q, reponse, score, palier);
}

// ─── Révélation ─────────────────────────────────────────────────────────────
function afficherRevelation(q, reponseJoueur, score, palier) {
  const container = document.getElementById('ecran-jeu');
  const pourcentageEcart = ((reponseJoueur - q.reponse) / q.reponse * 100).toFixed(0);
  const signePct = pourcentageEcart > 0 ? '+' : '';
  const estDerniereQuestion = questionIndex === 2;

  container.innerHTML = `
    <div class="revelation">
      <div class="palier-badge" style="background:${palier.couleur}">
        ${palier.emoji} ${palier.label}
      </div>
      <div class="score-question">+${score} pts</div>

      <div class="comparaison">
        <div class="comp-case joueur">
          <div class="comp-label">Ta réponse</div>
          <div class="comp-valeur">${formaterNombre(reponseJoueur)}</div>
          <div class="comp-unite">${q.unite}</div>
          <div class="comp-ecart">${signePct}${pourcentageEcart} %</div>
        </div>
        <div class="comp-vs">VS</div>
        <div class="comp-case verite">
          <div class="comp-label">La réalité</div>
          <div class="comp-valeur">${formaterNombre(q.reponse)}</div>
          <div class="comp-unite">${q.unite}</div>
        </div>
      </div>

      <div class="source-anecdote">
        <p class="anecdote">${q.anecdote}</p>
        <p class="source">Source : ${q.source}</p>
      </div>

      <button class="btn-suivant" onclick="${estDerniereQuestion ? 'finaliserPartie()' : 'questionSuivante()'}">
        ${estDerniereQuestion ? 'Voir mon résultat' : 'Question suivante →'}
      </button>
    </div>
  `;
}

// ─── Question suivante ───────────────────────────────────────────────────────
function questionSuivante() {
  questionIndex += 1;
  afficherQuestion();
}

// ─── Finalisation ────────────────────────────────────────────────────────────
function finaliserPartie() {
  if (!modeArchive) {
    enregistrerResultat(donneesJoueur, mancheActive.numero, scoresPartie, paliersPartie);
  }
  afficherResultatFinal(scoresPartie, paliersPartie);
}

function afficherResultatFinal(scores, paliers) {
  const container = document.getElementById('ecran-jeu');
  const total = scores.reduce((a, b) => a + b, 0);
  const donneesActuelles = chargerDonnees();
  const textePartage = construireTextePartage(mancheActive.numero, scores, paliers, donneesActuelles.streak_actuel);

  const recapHtml = paliers.map((p, i) => {
    const palierInfo = PALIERS.find(x => x.id === p);
    return `
      <div class="recap-ligne">
        <span class="recap-q">Q${i + 1}</span>
        <span class="recap-badge" style="color:${palierInfo.couleur}">${palierInfo.emoji} ${palierInfo.label}</span>
        <span class="recap-score">${scores[i]} pts</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="resultat-final">
      <h2 class="score-total">${total}<span class="sur">/300</span></h2>
      <p class="score-label">Score du jour</p>

      <div class="recap-questions">${recapHtml}</div>

      ${!modeArchive ? `
        <div class="streak-resultat">
          🔥 Streak : ${donneesActuelles.streak_actuel} jour${donneesActuelles.streak_actuel > 1 ? 's' : ''}
        </div>
      ` : ''}

      <div class="boutons-resultat">
        <button class="btn-partager" onclick="partager(\`${textePartage.replace(/`/g, '\\`')}\`)">
          📋 Copier mon résultat
        </button>
        <button class="btn-stats" onclick="afficherStats()">
          📊 Mes statistiques
        </button>
      </div>

      ${modeArchive ? '<p class="note-archive">Mode archive — résultat non comptabilisé</p>' : ''}
    </div>
  `;
}

// ─── Statistiques ────────────────────────────────────────────────────────────
function afficherStats() {
  const d = chargerDonnees();
  const container = document.getElementById('ecran-jeu');
  const total = Object.values(d.stats.repartition_paliers).reduce((a, b) => a + b, 0);

  const barresHtml = PALIERS.map(p => {
    const nb = d.stats.repartition_paliers[p.id] || 0;
    const pct = total > 0 ? Math.round(nb / total * 100) : 0;
    return `
      <div class="stat-ligne">
        <span class="stat-emoji">${p.emoji}</span>
        <div class="stat-barre-container">
          <div class="stat-barre" style="width:${pct}%;background:${p.couleur}"></div>
        </div>
        <span class="stat-nb">${nb}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="stats-panel">
      <h2>Mes statistiques</h2>

      <div class="stats-chiffres">
        <div class="stat-chiffre">
          <div class="stat-val">${d.stats.parties}</div>
          <div class="stat-lbl">Parties</div>
        </div>
        <div class="stat-chiffre">
          <div class="stat-val">${d.stats.score_moyen}</div>
          <div class="stat-lbl">Score moyen</div>
        </div>
        <div class="stat-chiffre">
          <div class="stat-val">${d.streak_actuel}</div>
          <div class="stat-lbl">Streak actuel</div>
        </div>
        <div class="stat-chiffre">
          <div class="stat-val">${d.meilleur_streak}</div>
          <div class="stat-lbl">Meilleur streak</div>
        </div>
      </div>

      <h3>Répartition des paliers</h3>
      <div class="stats-barres">${barresHtml}</div>

      <button class="btn-retour" onclick="location.reload()">← Retour</button>
    </div>
  `;
}
