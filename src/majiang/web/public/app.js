const lobby = document.getElementById('lobby');
const table = document.getElementById('table');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultScore = document.getElementById('result-score');

let currentSessionId = null;
let currentState = null;

startBtn.addEventListener('click', async () => {
  const response = await fetch('/api/majiang/session', {
    method: 'POST'
  });
  const payload = await response.json();
  currentSessionId = payload.sessionId;
  renderState(payload.state);
  lobby.classList.add('hidden');
  table.classList.remove('hidden');
});

restartBtn.addEventListener('click', async () => {
  if (!currentSessionId) {
    return;
  }

  const response = await fetch(`/api/majiang/session/${currentSessionId}/restart`, {
    method: 'POST'
  });
  const payload = await response.json();
  renderState(payload.state);
});

function renderState(state) {
  currentState = state;
  document.getElementById('game-state').textContent = state.gameState;
  document.getElementById('remaining-tiles').textContent = String(state.remainingTiles);
  document.getElementById('current-prompt').textContent = state.currentPrompt;
  document.getElementById('last-discarded').textContent = state.lastDiscardedTile || '无';

  const topSeat = state.seats[2];
  const leftSeat = state.seats[1];
  const rightSeat = state.seats[3];
  const bottomSeat = state.seats[0];

  renderSeat(document.getElementById('seat-top'), topSeat, false);
  renderSeat(document.getElementById('seat-left'), leftSeat, false);
  renderSeat(document.getElementById('seat-right'), rightSeat, false);
  renderSeat(document.getElementById('seat-bottom'), bottomSeat, true);

  renderDiscardPools(state.seats);
  renderActionButtons(state);

  if (state.result.isEnded) {
    resultTitle.textContent = state.result.winnerName ? `${state.result.winnerName} 获胜` : '本局结束';
    resultScore.textContent = state.result.scoreSummary;
    resultModal.classList.remove('hidden');
  } else {
    resultModal.classList.add('hidden');
  }
}

function renderActionButtons(state) {
  const humanSeat = document.getElementById('seat-bottom');
  const existing = humanSeat.querySelector('.action-strip');
  if (existing) {
    existing.remove();
  }

  const actions = state.availableActions.filter(action => action !== 'DISCARD');
  if (!actions.length) {
    return;
  }

  const actionStrip = document.createElement('div');
  actionStrip.className = 'action-strip';
  actionStrip.innerHTML = actions.map(action => `<button class="primary-btn" data-action="${action}">${action}</button>`).join('');
  humanSeat.appendChild(actionStrip);
  actionStrip.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!currentSessionId) {
        return;
      }

      const response = await fetch(`/api/majiang/session/${currentSessionId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: button.getAttribute('data-action') })
      });
      const payload = await response.json();
      if (!response.ok) {
        alert(payload.error || '响应动作失败');
        return;
      }

      renderState(payload.state);
    });
  });
}

function renderSeat(container, seat, isHuman) {
  const revealed = seat.revealedSets.length
    ? seat.revealedSets.map(set => `<span class="chip">${set.type}:${set.tiles.join(' ')}</span>`).join('')
    : '<span class="chip">无明牌</span>';

  const discarded = seat.discardedTiles.length
    ? seat.discardedTiles.map(tile => `<span class="chip">${tile}</span>`).join('')
    : '<span class="chip">暂无弃牌</span>';

  const tiles = seat.concealedTiles.map((tile, index) => {
    const isActionable = isHuman && currentState && currentState.availableActions.includes('DISCARD') && seat.isCurrentPlayer;
    const classes = ['tile'];
    if (!isHuman) {
      classes.push('back');
    }
    if (isActionable) {
      classes.push('selectable');
    }

    const label = isHuman ? tile : '牌背';
    const clickAttr = isActionable ? `data-index="${index}"` : '';
    return `<button class="${classes.join(' ')}" ${clickAttr}>${label}</button>`;
  }).join('');

  container.className = `seat panel${seat.isCurrentPlayer ? ' current' : ''}`;
  container.innerHTML = `
    <div class="seat-header">
      <h3>${seat.name}</h3>
      <span class="seat-status">${seat.state} · ${seat.handCount} 张</span>
    </div>
    <div class="tile-strip">${tiles || '<span class="chip">无手牌</span>'}</div>
    <p class="eyebrow">明牌</p>
    <div class="revealed-strip">${revealed}</div>
    <p class="eyebrow">弃牌</p>
    <div class="discard-strip">${discarded}</div>
  `;

  if (isHuman) {
    container.querySelectorAll('[data-index]').forEach(button => {
      button.addEventListener('click', async () => {
        const tileIndex = Number(button.getAttribute('data-index'));
        if (!Number.isInteger(tileIndex) || !currentSessionId) {
          return;
        }

        const response = await fetch(`/api/majiang/session/${currentSessionId}/discard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tileIndex })
        });
        const payload = await response.json();
        if (!response.ok) {
          alert(payload.error || '出牌失败');
          return;
        }

        renderState(payload.state);
      });
    });
  }
}

function renderDiscardPools(seats) {
  const container = document.getElementById('discard-pools');
  container.innerHTML = seats.map(seat => `
    <div class="discard-pool">
      <label>${seat.name}</label>
      <div class="discard-strip">
        ${seat.discardedTiles.length
          ? seat.discardedTiles.map(tile => `<span class="chip">${tile}</span>`).join('')
          : '<span class="chip">暂无弃牌</span>'}
      </div>
    </div>
  `).join('');
}
