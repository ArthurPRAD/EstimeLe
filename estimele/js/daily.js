let _questionsData = null;

async function chargerQuestions() {
  if (_questionsData) return _questionsData;
  const resp = await fetch('data/questions.json');
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
      if (q.borne_max / q.borne_min < 100) {
        console.error(`Question ${q.id} : la plage borne_min/borne_max couvre moins de 2 ordres de grandeur`);
      }
    });
  });
}

function getMancheIndex(config, nombreManches) {
  const lancement = new Date(config.date_lancement);
  lancement.setHours(0, 0, 0, 0);
  const maintenant = new Date();
  maintenant.setHours(0, 0, 0, 0);
  const jourEcoules = Math.floor((maintenant - lancement) / 86400000);
  return ((jourEcoules % nombreManches) + nombreManches) % nombreManches;
}

async function getMancheDuJour() {
  const data = await chargerQuestions();
  const idx = getMancheIndex(data.config, data.manches.length);
  return data.manches[idx];
}

async function getMancheParNumero(numero) {
  const data = await chargerQuestions();
  return data.manches.find(m => m.numero === numero) || null;
}

async function getToutesLesManches() {
  const data = await chargerQuestions();
  return data.manches;
}
