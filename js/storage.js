const STORAGE_KEY = 'estimele_data';
const STORAGE_VERSION = 2;

const DEFAULT_DATA = {
  version: STORAGE_VERSION,
  partie_en_cours: null,
  historique: [],
  stats: {
    parties: 0,
    score_moyen: 0,
    repartition_paliers: { bullseye: 0, proche: 0, ordre: 0, loin: 0, planete: 0 }
  }
};

function chargerDonnees() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const data = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) return migrer(data);
    return data;
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function sauvegarderDonnees(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function migrer(data) {
  const base = { ...structuredClone(DEFAULT_DATA), ...data, version: STORAGE_VERSION };
  delete base.streak_actuel;
  delete base.meilleur_streak;
  delete base.dernier_jour_joue;
  return base;
}

function dateAujourdhui() {
  const fake = sessionStorage.getItem('estimele_debug_date');
  const d = fake ? new Date(fake) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function enregistrerResultat(data, numManche, scores, paliers) {
  const aujourd = dateAujourdhui();

  data.historique.push({
    jour: aujourd,
    manche: numManche,
    scores,
    paliers
  });

  // Mise à jour des stats
  data.stats.parties += 1;
  const totalScore = scores.reduce((a, b) => a + b, 0);
  data.stats.score_moyen = Math.round(
    (data.stats.score_moyen * (data.stats.parties - 1) + totalScore) / data.stats.parties
  );
  paliers.forEach(p => {
    if (data.stats.repartition_paliers[p] !== undefined) {
      data.stats.repartition_paliers[p] += 1;
    }
  });

  data.partie_en_cours = null;
  sauvegarderDonnees(data);
}

function aDejaJoueAujourdhui(data, numManche) {
  const aujourd = dateAujourdhui();
  return data.historique.some(h => h.jour === aujourd && h.manche === numManche);
}

function getResultatDuJour(data, numManche) {
  const aujourd = dateAujourdhui();
  return data.historique.find(h => h.jour === aujourd && h.manche === numManche) || null;
}
