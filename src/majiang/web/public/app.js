const lobby = document.getElementById('lobby');
const table = document.getElementById('table');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultDetail = document.getElementById('result-detail');
const resultScore = document.getElementById('result-score');
const statusBanner = document.getElementById('status-banner');

let currentSessionId = null;
let currentState = null;
let currentRequestCount = 0;

setStatus('准备开始一局新的本地麻将对局。');

startBtn.addEventListener('click', async () => {
  try {
    const mode = getSelectedMode();
    setPending(true, '正在创建对局...');
    const payload = await requestJson('/api/majiang/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mode })
    });
    currentSessionId = payload.sessionId;
    renderState(payload.state);
    lobby.classList.add('hidden');
    table.classList.remove('hidden');
    setStatus('对局已开始，等待你的第一步操作。');
  } catch (error) {
    setStatus(error.message || '创建对局失败', true);
  } finally {
    setPending(false);
  }
});

restartBtn.addEventListener('click', async () => {
  if (!currentSessionId) {
    return;
  }

  try {
    setPending(true, '正在重新开始对局...');
    const payload = await requestJson(`/api/majiang/session/${currentSessionId}/restart`, {
      method: 'POST'
    });
    renderState(payload.state);
    setStatus('已重新开始新一局。');
  } catch (error) {
    setStatus(error.message || '重新开始失败', true);
  } finally {
    setPending(false);
  }
});

function getSelectedMode() {
  const selected = document.querySelector('input[name="game-mode"]:checked');
  return selected ? selected.value : 'manual';
}

const WIND_LABELS = ['东', '南', '西', '北'];
const AVATAR_MAP = {
  '东家': '/majiang-web/assets/avatar-east.jpg',
  '南家': '/majiang-web/assets/avatar-south.jpg',
  '西家': '/majiang-web/assets/avatar-west.jpg',
  '北家': '/majiang-web/assets/avatar-north.jpg'
};

function renderState(state) {
  currentState = state;
  document.getElementById('game-state').textContent = state.gameState;
  document.getElementById('current-player').textContent = state.seats[state.currentPlayerIndex]?.name || '-';
  document.getElementById('banker-player').textContent = state.seats[state.bankerIndex]?.name || '-';
  document.getElementById('wind-round').textContent = String(state.windRound);
  document.getElementById('draw-count').textContent = String(state.drawCount);
  document.getElementById('remaining-tiles').textContent = String(state.remainingTiles);
  document.getElementById('current-prompt').textContent = state.currentPrompt;

  const centerWind = document.getElementById('center-wind');
  const centerRound = document.getElementById('center-round');
  if (centerWind) centerWind.textContent = WIND_LABELS[(state.windRound - 1) % 4] || '东';
  if (centerRound) centerRound.textContent = String(state.windRound);

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
  renderTableHint(state, bottomSeat);

  if (state.result.isEnded) {
    resultTitle.textContent = state.result.winnerName ? `${state.result.winnerName} 获胜` : '本局结束';
    resultDetail.textContent = state.result.winTypeLabel ? `结算类型：${state.result.winTypeLabel}` : '本局未记录到胡牌类型。';
    resultScore.textContent = state.result.scoreSummary;
    resultModal.classList.remove('hidden');
    setStatus('本局已经结束，可以查看结果并再次开始。');
  } else {
    resultModal.classList.add('hidden');
    resultDetail.textContent = '-';
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
  actionStrip.innerHTML = actions
    .map(action => `<button class="primary-btn" data-action="${action}" data-testid="response-action">${action}</button>`)
    .join('');
  humanSeat.appendChild(actionStrip);
  actionStrip.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!currentSessionId) {
        return;
      }

      try {
        const action = button.getAttribute('data-action');
        setPending(true, `正在提交动作 ${action}...`);
        const payload = await requestJson(`/api/majiang/session/${currentSessionId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        });
        renderState(payload.state);
        if (!payload.state.result.isEnded) {
          setStatus(`已提交动作 ${action}。`);
        }
      } catch (error) {
        setStatus(error.message || '响应动作失败', true);
      } finally {
        setPending(false);
      }
    });
  });
}

function getTileBg(tile) {
  if (tile.includes('万')) return '/majiang-web/assets/tile-wan.jpg';
  if (tile.includes('筒')) return '/majiang-web/assets/tile-tong.jpg';
  if (tile.includes('条')) return '/majiang-web/assets/tile-tiao.jpg';
  return '/majiang-web/assets/tile-zhong.jpg';
}

function renderTileButton(tile, index, isHuman, isActionable) {
  const classes = ['tile'];
  if (!isHuman) classes.push('back');
  if (isActionable) classes.push('selectable');

  const clickAttr = isActionable ? `data-index="${index}" data-testid="human-tile"` : '';

  if (!isHuman) {
    return `<button class="${classes.join(' ')}" ${clickAttr}><span class="tile-back-face"></span></button>`;
  }

  const bg = getTileBg(tile);
  return `<button class="${classes.join(' ')}" ${clickAttr} style="background-image:url('${bg}')"><span class="tile-label">${tile}</span></button>`;
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
    return renderTileButton(tile, index, isHuman, isActionable);
  }).join('');

  const avatarSrc = AVATAR_MAP[seat.name] || '';
  const avatarHtml = avatarSrc ? `<img class="seat-avatar" src="${avatarSrc}" alt="${seat.name}" />` : '';

  container.className = `seat${seat.isCurrentPlayer ? ' current' : ''}`;
  container.innerHTML = `
    <div class="seat-header">
      <div style="display:flex;gap:10px;align-items:center;">
        ${avatarHtml}
        <h3>${seat.name}</h3>
      </div>
      <span class="seat-status">${seat.state} · ${seat.handCount} 张</span>
    </div>
    ${isHuman ? `<p class="drawn-tile">最近摸牌：${seat.lastDrawnTile || '暂无'}</p>` : ''}
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

        try {
          setPending(true, `正在打出第 ${tileIndex + 1} 张手牌...`);
          const payload = await requestJson(`/api/majiang/session/${currentSessionId}/discard`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tileIndex })
          });
          renderState(payload.state);
          if (!payload.state.result.isEnded) {
            setStatus('出牌成功，AI 正在继续推进回合。');
          }
        } catch (error) {
          setStatus(error.message || '出牌失败', true);
        } finally {
          setPending(false);
        }
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

function renderTableHint(state, humanSeat) {
  const hintEl = document.getElementById('table-hint');
  if (state.result.isEnded) {
    hintEl.textContent = '对局已结束，可查看结算结果并点击“再来一局”继续。';
    return;
  }

  if (state.availableActions.includes('DISCARD') && humanSeat.isCurrentPlayer) {
    hintEl.textContent = '当前轮到你出牌，请点击下方任意一张手牌。';
    return;
  }

  const responseActions = state.availableActions.filter(action => action !== 'DISCARD');
  if (responseActions.length) {
    hintEl.textContent = `你可以对上一张弃牌执行：${responseActions.join(' / ')}。`;
    return;
  }

  hintEl.textContent = `${state.currentPrompt} 当前无需你的直接操作。`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || '请求失败');
  }
  return payload;
}

function setPending(pending, message = '') {
  if (pending) {
    currentRequestCount += 1;
  } else {
    currentRequestCount = Math.max(0, currentRequestCount - 1);
  }

  const isBusy = currentRequestCount > 0;
  startBtn.disabled = isBusy;
  restartBtn.disabled = isBusy;
  document.body.classList.toggle('is-busy', isBusy);

  if (isBusy && message) {
    setStatus(message);
  }
}

function setStatus(message, isError = false) {
  statusBanner.textContent = message;
  statusBanner.classList.remove('hidden', 'error');
  if (isError) {
    statusBanner.classList.add('error');
  }
}
