async function initialiserArchives() {
  const manches = await getManchesDisponibles();
  const donnees = chargerDonnees();
  const container = document.getElementById('liste-archives');

  if (!manches.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--ink-mid)">
        <p style="font-size:1.5rem;margin-bottom:0.75rem">📅</p>
        <p>Aucune archive pour l'instant.</p>
        <p style="font-size:0.85rem;margin-top:0.4rem">Les manches passées apparaîtront ici dès le lendemain du lancement.</p>
      </div>`;
    return;
  }

  // Afficher les plus récentes en premier
  const manchesTri = [...manches].reverse();

  const html = manchesTri.map(manche => {
    const historique = donnees.historique.find(h => h.manche === manche.numero);
    let statut = '';
    let scoreHtml = '';

    if (historique) {
      const total = historique.scores.reduce((a, b) => a + b, 0);
      const emojis = historique.paliers.map(p => {
        const info = [
          { id: 'bullseye', emoji: '🎯' }, { id: 'proche', emoji: '🔥' },
          { id: 'ordre', emoji: '👌' }, { id: 'loin', emoji: '😬' },
          { id: 'planete', emoji: '🚀' }
        ].find(x => x.id === p);
        return info?.emoji || '?';
      }).join('');
      statut = 'joue';
      scoreHtml = `<span class="archive-score">${emojis} ${total}/300</span>`;
    }

    return `
      <div class="archive-carte ${statut}">
        <div class="archive-info">
          <span class="archive-num">#${manche.numero} — ${manche.date}</span>
          <span class="archive-themes">${[...new Set(manche.questions.map(q => q.theme))].join(' · ')}</span>
          ${scoreHtml}
        </div>
        <a href="index.html?archive=${manche.numero}" class="btn-rejouer">
          ${historique ? 'Rejouer' : 'Jouer'}
        </a>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initialiserArchives);
