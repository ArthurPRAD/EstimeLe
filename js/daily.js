let _questionsData = null;

async function chargerQuestions() {
  if (_questionsData) return _questionsData;
  const resp = await fetch('data/questionsV2.json');
  if (!resp.ok) throw new Error('Impossible de charger les questions.');
  _questionsData = await resp.json();
  validerBanque(_questionsData);
  return _questionsData;
}

function validerBanque(data) {
  data.manches.forEach((manche, i) => {
    if (manche.questions.length !== 3) {
      console.error(`Manche ${i + 1} : doit contenir exactement 3 questions (${manche.questions.length} trouvées)`);
    }
    manche.questions.forEach(q => {
      const champs = ['id', 'question', 'reponse', 'unite', 'borne_min', 'borne_max', 'source', 'anecdote', 'theme', 'difficulte'];
      champs.forEach(c => {
        if (q[c] === undefined || q[c] === '') {
          console.error(`Question ${q.id} : champ manquant ou vide : ${c}`);
        }
      });
      if (q.reponse <= q.borne_min * 1.15 || q.reponse >= q.borne_max / 1.15) {
        console.error(`Question ${q.id} : la réponse est trop proche d'une borne (règle des 15 %)`);
      }
      if (q.borne_max / q.borne_min < 10) {
        console.error(`Question ${q.id} : la plage borne_min/borne_max couvre moins d'un ordre de grandeur`);
      }
    });
  });
}

// Nombre de jours écoulés depuis le lancement (0 = jour de lancement)
function _joursEcoules(dateLancement) {
  const lancement = new Date(dateLancement);
  lancement.setHours(0, 0, 0, 0);
  const debugDate = sessionStorage.getItem('estimele_debug_date');
  const maintenant = debugDate ? new Date(debugDate) : new Date();
  maintenant.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((maintenant - lancement) / 86400000));
}

// Date formatée à partir d'un offset en jours depuis le lancement
function _dateFormatee(dateLancement, offsetJours) {
  const d = new Date(dateLancement);
  d.setDate(d.getDate() + offsetJours);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Manche du jour (null si plus de questions disponibles)
async function getMancheDuJour() {
  const data = await chargerQuestions();
  const jours = _joursEcoules(data.config.date_lancement);
  if (jours >= data.manches.length) return null;
  return data.manches[jours];
}

// Date formatée du jour en cours
async function getDateDuJour() {
  const data = await chargerQuestions();
  const jours = _joursEcoules(data.config.date_lancement);
  return _dateFormatee(data.config.date_lancement, jours);
}

// Date formatée pour un numéro de manche donné (manche 1 = jour 0, etc.)
async function getDateDeManche(numero) {
  const data = await chargerQuestions();
  return _dateFormatee(data.config.date_lancement, numero - 1);
}

// Manche par numéro (pour les archives)
async function getMancheParNumero(numero) {
  const data = await chargerQuestions();
  return data.manches.find(m => m.numero === numero) || null;
}

// Manches déjà disponibles = celles dont la date est strictement avant aujourd'hui
async function getManchesDisponibles() {
  const data = await chargerQuestions();
  const jours = _joursEcoules(data.config.date_lancement);
  return data.manches
    .filter((_, i) => i < jours)
    .map(m => ({
      ...m,
      date: _dateFormatee(data.config.date_lancement, m.numero - 1)
    }));
}
