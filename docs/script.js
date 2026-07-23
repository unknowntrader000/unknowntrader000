const checks = [...document.querySelectorAll('input[data-points]')];
const routineTasks = [...document.querySelectorAll('.routine-task')];
const spellcheckFields = [...document.querySelectorAll('textarea')];
spellcheckFields.forEach(field => {
  field.spellcheck = true;
  field.lang = 'en-AU';
  field.setAttribute('autocapitalize', 'sentences');
});

const spellingCorrections = {
  'sojestion': 'suggestion', 'sugestion': 'suggestion', 'sugestions': 'suggestions',
  'currenciy': 'currency', 'currenciesy': 'currencies', 'comodity': 'commodity',
  'comodties': 'commodities', 'etherum': 'ethereum', 'bitcion': 'bitcoin',
  'analisis': 'analysis', 'becuase': 'because', 'recieve': 'receive',
  'teh': 'the', 'thier': 'their', 'wich': 'which', 'wont': "won't",
  'doesnt': "doesn't", 'dont': "don't", 'cant': "can't", 'isnt': "isn't",
  'im': "I'm", 'ive': "I've", 'youre': "you're", 'theyre': "they're",
  'writting': 'writing', 'wrighting': 'writing', 'writeing': 'writing',
  'speling': 'spelling', 'speeling': 'spelling', 'spelt': 'spelled',
  'fic': 'fix', 'fixx': 'fix', 'corect': 'correct', 'correctingg': 'correcting',
  'opion': 'option', 'opions': 'options', 'wordss': 'words', 'thats': "that's",
  'seperate': 'separate', 'definately': 'definitely', 'alot': 'a lot',
  'somthing': 'something', 'becouse': 'because', 'untill': 'until',
  'baisicly': 'basically', 'diffrent': 'different', 'individuL': 'individual'
};
const spellingWords = new Set("suggestion suggestions currency currencies commodity commodities ethereum bitcoin market markets pair pairs trade trading trader buy sell wait long short bullish bearish neutral entry exit stop loss target risk reward chart charts price level levels support resistance liquidity breakout retest trend session sessions analysis plan setup order orders news data inflation interest rate dollar euro yen pound franc canadian australian zealand gold silver oil copper platinum index indices crypto tradingview daily weekly monthly writing spelling fix correct option options words something because until basically different individual note notes idea ideas review reviewed support resistance account position profit loss candle candles volume strategy strategies discipline patience opportunity opportunities movement momentum reversal range direction confirmation breakouts retracements volatility tradeable watching scheduled selected event events important potential prepare preparation checklist routine journal learn lesson lessons result results morning afternoon evening today tomorrow yesterday".split(' '));

function spellingDistance(first, second) {
  const rows = Array.from({ length: first.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= second.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= first.length; row += 1) {
    for (let column = 1; column <= second.length; column += 1) {
      rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1));
    }
  }
  return rows[first.length][second.length];
}

function spellingSuggestion(word) {
  const lower = word.toLowerCase();
  if (spellingCorrections[lower]) return spellingCorrections[lower];
  if (lower.length < 5 || spellingWords.has(lower)) return null;
  const candidate = [...spellingWords].filter(item => Math.abs(item.length - lower.length) <= 1).map(item => ({ item, distance: spellingDistance(lower, item) })).sort((a, b) => a.distance - b.distance)[0];
  return candidate && candidate.distance <= 1 ? candidate.item : null;
}

function addSpellingSuggestions(field) {
  const helper = document.createElement('div');
  helper.className = 'spelling-suggestions';
  helper.hidden = true;
  (field.closest('.pair-note-editor, .currency-note-editor, .market-note-editor') || field.parentElement).append(helper);
  const refreshSuggestions = () => {
    const matches = [...new Set((field.value.match(/[A-Za-z']+/g) || []).map(word => ({ word, suggestion: spellingSuggestion(word) })).filter(item => item.suggestion && item.suggestion !== item.word.toLowerCase()).map(item => `${item.word}|${item.suggestion}`))].slice(0, 3);
    helper.replaceChildren();
    helper.hidden = matches.length === 0;
    if (!matches.length) return;
    const label = document.createElement('span');
    label.textContent = 'Suggestions';
    helper.append(label);
    matches.forEach(match => {
      const [word, suggestion] = match.split('|');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${word} â†’ ${suggestion}`;
      button.addEventListener('click', () => {
        field.value = field.value.replace(new RegExp(`\\b${word}\\b`, 'gi'), suggestion);
        field.dispatchEvent(new Event('input'));
      });
      helper.append(button);
    });
  };
  field.addEventListener('input', refreshSuggestions);
  field.addEventListener('focus', refreshSuggestions);
  field.addEventListener('change', refreshSuggestions);
}

spellcheckFields.forEach(addSpellingSuggestions);
const score = document.querySelector('#score'), scoreOutOf = document.querySelector('#scoreOutOf'), meter = document.querySelector('#meter'), message = document.querySelector('#scoreMessage');
const key = 'trade-day-scorecard';
document.querySelectorAll('.routine-options').forEach(options => {
  const existingInput = options.querySelector('input');
  const waitChoice = document.createElement('label');
  waitChoice.className = 'routine-choice';
  waitChoice.innerHTML = `<input type="radio" name="${existingInput.name}" value="wait"><span class="choice-box">Wait</span>`;
  options.append(waitChoice);
});
routineTasks.forEach(task => {
  const streak = document.createElement('span');
  streak.className = 'task-streak';
  streak.dataset.taskStreak = task.dataset.taskId;
  streak.textContent = '0 streak';
  task.querySelector('.task-row small').before(streak);
});
const saved = JSON.parse(localStorage.getItem(key) || '{}');
const savedRoutineTasks = saved && !Array.isArray(saved) && saved.dateKey === hobartDateKey() ? saved.tasks || {} : {};
routineTasks.forEach((task, index) => {
  const taskState = savedRoutineTasks[task.dataset.taskId];
  const radios = [...task.querySelectorAll('input[type="radio"]')];
  const reason = task.querySelector('textarea');
  const reasonBox = task.querySelector('.no-reason');
  const oldChecked = Array.isArray(saved) && saved[index];
  const selected = taskState?.answer || (oldChecked ? 'yes' : 'wait');
  radios.forEach(radio => { radio.checked = radio.value === selected; radio.addEventListener('change', () => { reasonBox.hidden = radio.value !== 'no'; updateScore(); }); });
  reason.value = taskState?.reason || '';
  reasonBox.hidden = selected !== 'no';
  reason.addEventListener('input', saveRoutineState);
});
function saveRoutineState() {
  const tasks = Object.fromEntries(routineTasks.map(task => [task.dataset.taskId, {
    answer: task.querySelector('input[type="radio"]:checked')?.value || '',
    reason: task.querySelector('textarea').value
  }]));
  localStorage.setItem(key, JSON.stringify({ dateKey: hobartDateKey(), tasks }));
}
function routineLetterGrade(points, maximum) {
  if (points === maximum) return 'A';
  if (points >= Math.ceil(maximum / 2)) return 'B';
  if (points >= 0) return 'C';
  if (points > -maximum) return 'D';
  return 'E';
}
function updateScore() {
  const maximum = routineTasks.length;
  const total = routineTasks.reduce((points, task) => {
    const answer = task.querySelector('input[type="radio"]:checked')?.value;
    return points + (answer === 'yes' ? 1 : answer === 'no' ? -1 : 0);
  }, 0);
  document.querySelectorAll('[data-routine-group]').forEach(group => {
    const tasks = [...group.querySelectorAll('.routine-task')];
    const groupPoints = tasks.reduce((points, task) => {
      const answer = task.querySelector('input[type="radio"]:checked')?.value;
      return points + (answer === 'yes' ? 1 : answer === 'no' ? -1 : 0);
    }, 0);
    const groupName = group.dataset.routineGroup;
    document.querySelector(`[data-routine-score="${groupName}"]`).textContent = groupPoints;
    document.querySelector(`[data-routine-grade="${groupName}"]`).textContent = routineLetterGrade(groupPoints, tasks.length);
  });
  if (score && scoreOutOf && meter && message) {
    score.textContent = total;
    scoreOutOf.textContent = maximum;
    meter.style.width = `${Math.max(0, ((total + maximum) / (maximum * 2)) * 100)}%`;
    message.textContent = `Routine grade: ${routineLetterGrade(total, maximum)}.`;
  }
  saveRoutineState();
  syncRoutineWaitTasks();
}
document.querySelector('#reset').addEventListener('click', () => { routineTasks.forEach(task => { task.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = radio.value === 'wait'); task.querySelector('textarea').value = ''; task.querySelector('.no-reason').hidden = true; }); updateScore(); });
const routineHistoryKey = 'unknown-trader-routine-history';
const routineHistory = document.querySelector('#routineHistory');
const routineHistorySearch = document.querySelector('#routineHistorySearch');
const routineHistoryToggle = document.querySelector('#routineHistoryToggle');
const routineHistoryContent = document.querySelector('#routineHistoryContent');
const routineHistoryToggleLabel = document.querySelector('#routineHistoryToggleLabel');
const routineWeeklyMisses = document.querySelector('#routineWeeklyMisses');
function readRoutineHistory() { try { return JSON.parse(localStorage.getItem(routineHistoryKey) || '[]'); } catch { return []; } }
function writeRoutineHistory(entries) { localStorage.setItem(routineHistoryKey, JSON.stringify(entries)); }
function hobartDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Hobart', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function routineAnswerLabel(answer) { return answer ? answer[0].toUpperCase() + answer.slice(1) : 'Not answered'; }
function previousRoutineDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
function renderRoutineStreaks() {
  const entries = readRoutineHistory();
  routineTasks.forEach(task => {
    const answersByDate = new Map();
    entries.forEach(entry => {
      const dateKey = entry.id.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      const savedTask = entry.tasks.find(item => item.id === task.dataset.taskId || item.label === task.querySelector('.task-row > span').textContent);
      if (dateKey && savedTask) answersByDate.set(dateKey, savedTask.answer);
    });
    let dateKey = hobartDateKey(), streak = 0;
    while (answersByDate.get(dateKey) === 'yes') { streak += 1; dateKey = previousRoutineDate(dateKey); }
    const label = document.querySelector(`[data-task-streak="${task.dataset.taskId}"]`);
    label.textContent = `${streak} ${streak === 1 ? 'streak' : 'streaks'}`;
  });
}
function routineDateMatches(entry, search) {
  if (!search) return true;
  const dateKey = entry.id.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
  const [year, month, day] = dateKey.split('-');
  const compactSearch = search.replace(/[^0-9a-z]/g, '');
  const dateFormats = [dateKey, `${day}/${month}/${year}`, `${day}/${month}`, `${day}${month}${year}`, `${day}${month}`, `${year}${month}${day}`];
  return `${entry.date} ${entry.id}`.toLowerCase().includes(search) || dateFormats.some(value => value.toLowerCase().includes(compactSearch));
}
function routineWeekKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
function renderWeeklyRoutineMisses() {
  const weeks = new Map();
  readRoutineHistory().forEach(entry => {
    const dateKey = entry.id.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!dateKey) return;
    const weekKey = routineWeekKey(dateKey);
    if (!weeks.has(weekKey)) weeks.set(weekKey, new Map());
    entry.tasks.forEach(task => {
      if (task.answer === 'yes') return;
      const taskSummary = weeks.get(weekKey).get(task.label) || { total: 0, no: 0, wait: 0 };
      taskSummary.total += 1;
      if (task.answer === 'no') taskSummary.no += 1; else taskSummary.wait += 1;
      weeks.get(weekKey).set(task.label, taskSummary);
    });
  });
  routineWeeklyMisses.replaceChildren();
  if (!weeks.size) { const empty = document.createElement('p'); empty.className = 'empty-routine-history'; empty.textContent = 'No missed tasks saved yet.'; routineWeeklyMisses.append(empty); return; }
  [...weeks.entries()].sort(([first], [second]) => second.localeCompare(first)).forEach(([weekKey, tasks]) => {
    const week = document.createElement('article'); week.className = 'routine-week-summary';
    const title = document.createElement('strong'); title.textContent = `Week of ${new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Hobart', dateStyle: 'medium' }).format(new Date(`${weekKey}T12:00:00Z`))}`;
    week.append(title);
    const list = document.createElement('ul');
    [...tasks.entries()].sort(([, first], [, second]) => second.total - first.total).forEach(([label, summary]) => {
      const item = document.createElement('li'); item.textContent = `${label} â€” ${summary.total} missed (${summary.no} No, ${summary.wait} waiting)`; list.append(item);
    });
    week.append(list); routineWeeklyMisses.append(week);
  });
}
function openRoutineHistoryEditor(entry, card) {
  card.querySelector('.routine-history-editor')?.remove();
  const editor = document.createElement('form'); editor.className = 'routine-history-editor';
  entry.tasks.forEach((task, index) => {
    const field = document.createElement('div'); field.className = 'routine-history-edit-task';
    const label = document.createElement('label'); label.textContent = task.label;
    const select = document.createElement('select'); select.name = `answer-${index}`;
    [['yes', 'Yes'], ['no', 'No'], ['wait', 'Wait']].forEach(([value, text]) => { const option = document.createElement('option'); option.value = value; option.textContent = text; option.selected = (task.answer || 'wait') === value; select.append(option); });
    const reason = document.createElement('textarea'); reason.name = `reason-${index}`; reason.placeholder = 'Why not?'; reason.value = task.reason || ''; reason.hidden = select.value !== 'no';
    select.addEventListener('change', () => { reason.hidden = select.value !== 'no'; });
    field.append(label, select, reason); editor.append(field);
  });
  const actions = document.createElement('div'); actions.className = 'routine-history-edit-actions';
  const save = document.createElement('button'); save.type = 'submit'; save.textContent = 'Save changes';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.addEventListener('click', () => editor.remove());
  actions.append(save, cancel); editor.append(actions);
  editor.addEventListener('submit', event => {
    event.preventDefault();
    const updatedTasks = entry.tasks.map((task, index) => ({ ...task, answer: editor.elements[`answer-${index}`].value, reason: editor.elements[`reason-${index}`].value.trim() }));
    const points = updatedTasks.reduce((total, task) => total + (task.answer === 'yes' ? 1 : task.answer === 'no' ? -1 : 0), 0);
    const history = readRoutineHistory(); const savedEntry = { ...entry, tasks: updatedTasks, points, grade: routineLetterGrade(points, updatedTasks.length), updatedAt: new Date().toISOString() };
    const entryIndex = history.findIndex(item => item.id === entry.id);
    if (entryIndex >= 0) history[entryIndex] = savedEntry;
    writeRoutineHistory(history); renderRoutineHistory(); renderRoutineStreaks(); renderWeeklyRoutineMisses();
  });
  card.append(editor);
}
function renderRoutineHistory() {
  const search = routineHistorySearch.value.trim().toLowerCase();
  const entries = readRoutineHistory().filter(entry => routineDateMatches(entry, search));
  routineHistory.replaceChildren();
  if (!entries.length) { const empty = document.createElement('p'); empty.className = 'empty-routine-history'; empty.textContent = search ? 'No saved routine matches that date.' : 'No routines saved yet.'; routineHistory.append(empty); return; }
  entries.forEach(entry => {
    const card = document.createElement('article'); card.className = 'routine-history-entry';
    const head = document.createElement('div'); head.className = 'routine-history-entry-head';
    const title = document.createElement('strong'); title.textContent = entry.title;
    const summary = document.createElement('span'); summary.textContent = `${entry.date} Â· ${entry.points > 0 ? '+' : ''}${entry.points} pts Â· Grade ${entry.grade}`;
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'routine-history-edit'; edit.textContent = 'Edit'; edit.addEventListener('click', () => openRoutineHistoryEditor(entry, card));
    const controls = document.createElement('div'); controls.className = 'routine-history-entry-controls'; controls.append(summary, edit);
    head.append(title, controls); card.append(head);
    const taskList = document.createElement('ul');
    entry.tasks.forEach(task => { const item = document.createElement('li'); item.textContent = `${task.label}: ${routineAnswerLabel(task.answer)}${task.reason ? ` â€” ${task.reason}` : ''}`; taskList.append(item); });
    card.append(taskList); routineHistory.append(card);
  });
}
function saveRoutineGroup(groupName) {
  const group = document.querySelector(`[data-routine-group="${groupName}"]`);
  const tasks = [...group.querySelectorAll('.routine-task')].map(task => ({
    id: task.dataset.taskId,
    label: task.querySelector('.task-row > span').textContent,
    answer: task.querySelector('input[type="radio"]:checked')?.value || '',
    reason: task.querySelector('textarea').value.trim()
  }));
  const points = tasks.reduce((total, task) => total + (task.answer === 'yes' ? 1 : task.answer === 'no' ? -1 : 0), 0);
  const entry = { id: `${groupName}-${hobartDateKey()}`, groupName, title: group.querySelector('.group-top > span').textContent, date: new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Hobart', dateStyle: 'medium' }).format(new Date()), savedAt: new Date().toISOString(), points, grade: routineLetterGrade(points, tasks.length), tasks };
  const entries = readRoutineHistory();
  const existingIndex = entries.findIndex(item => item.id === entry.id);
  if (existingIndex >= 0) entries[existingIndex] = entry; else entries.unshift(entry);
  writeRoutineHistory(entries); renderRoutineHistory(); renderRoutineStreaks(); renderWeeklyRoutineMisses();
  document.querySelector(`[data-routine-saved="${groupName}"]`).textContent = `Saved Â· ${entry.date}`;
}
document.querySelectorAll('[data-save-routine]').forEach(button => button.addEventListener('click', () => saveRoutineGroup(button.dataset.saveRoutine)));
routineHistorySearch.addEventListener('input', renderRoutineHistory);
routineHistoryToggle.addEventListener('click', () => {
  const isOpen = !routineHistoryContent.hidden;
  routineHistoryContent.hidden = isOpen;
  routineHistoryToggle.setAttribute('aria-expanded', String(!isOpen));
  routineHistoryToggleLabel.textContent = isOpen ? 'Show' : 'Hide';
});
renderRoutineHistory();
renderRoutineStreaks();
renderWeeklyRoutineMisses();
document.querySelector('#today').textContent = new Intl.Date…15775 tokens truncated…or?.after(pairColorControl);
  pairColorLabel.textContent = pair;
  pairNote.value = pairNotes[pair] || '';
  pairNoteSaved.textContent = '';
  pairColorControl.hidden = false;
  updateWatchlistButton(pairWatchlistButton, selectedPairWatchlistItem);
  updateOpenTradeButton(pairOpenTradeButton, selectedPairWatchlistItem);
  fitNoteField(pairNote);
}

pairGrid.addEventListener('click', event => {
  const button = event.target.closest('.pair-button');
  if (!button) return;
  event.stopPropagation();
  showPairColorControl(button.querySelector('span').textContent, button);
}, true);

pairColorChoices.forEach(choice => choice.addEventListener('click', () => {
  if (!selectedPairForColor) return;
  pairColors[selectedPairForColor] = choice.dataset.pairColor;
  localStorage.setItem(pairColorsKey, JSON.stringify(pairColors));
  renderFx();
  renderWatchlist();
  renderOpenTrades();
}));

clearPairColor.addEventListener('click', () => {
  if (!selectedPairForColor) return;
  delete pairColors[selectedPairForColor];
  localStorage.setItem(pairColorsKey, JSON.stringify(pairColors));
  renderFx();
  renderWatchlist();
  renderOpenTrades();
});

savePairNote.addEventListener('click', () => {
  if (!selectedPairForColor) return;
  pairNotes[selectedPairForColor] = stampNote(pairNote.value);
  pairNote.value = pairNotes[selectedPairForColor];
  localStorage.setItem(pairNotesKey, JSON.stringify(pairNotes));
  pairNoteSaved.textContent = 'Saved';
});

pairWatchlistButton.addEventListener('click', () => {
  if (!selectedPairWatchlistItem) return;
  watchlist = isInWatchlist(selectedPairWatchlistItem) ? watchlist.filter(item => item.id !== selectedPairWatchlistItem.id) : [...watchlist, selectedPairWatchlistItem];
  saveWatchlist();
  renderWatchlist();
  updateWatchlistButton(pairWatchlistButton, selectedPairWatchlistItem);
});

pairOpenTradeButton.addEventListener('click', () => {
  if (!selectedPairWatchlistItem) return;
  requestOpenTradeRisk(selectedPairWatchlistItem);
});

renderFx();
const marketColorsKey = 'trade-day-market-colors';
const marketColors = JSON.parse(localStorage.getItem(marketColorsKey) || '{}');
const marketUniverse = document.querySelector('.market-universe');
const cryptoGrid = marketUniverse.querySelector('[aria-label="Crypto symbols"]');
const ethereumButton = document.createElement('button');
ethereumButton.className = 'pair-button';
ethereumButton.type = 'button';
ethereumButton.innerHTML = '<span>Ethereum</span><i>ETHUSD</i>';
cryptoGrid.append(ethereumButton);
const marketColorControl = document.querySelector('#marketColorControl');
const marketColorLabel = document.querySelector('#marketColorLabel');
const clearMarketColor = document.querySelector('#clearMarketColor');
const marketColorChoices = [...document.querySelectorAll('.market-color-choice')];
Object.keys(marketColors).forEach(market => { if (marketColors[market] === '#7d8580' || marketColors[market] === '#8b4e24') marketColors[market] = waitStatusColor; });
marketColorChoices.filter(choice => choice.classList.contains('wait')).forEach(choice => { choice.dataset.marketColor = waitStatusColor; });
const marketNotesKey = 'trade-day-market-notes';
const marketNotes = JSON.parse(localStorage.getItem(marketNotesKey) || '{}');
const marketNote = document.querySelector('#marketNote');
const saveMarketNote = document.querySelector('#saveMarketNote');
const marketNoteSaved = document.querySelector('#marketNoteSaved');
const marketWatchlistButton = createWatchlistButton(marketColorControl);
const marketOpenTradeButton = createOpenTradeButton(marketColorControl);
let selectedMarketForColor = null;
let selectedMarketWatchlistItem = null;

function decorateMarketColors() {
  marketUniverse.querySelectorAll('.pair-button').forEach(button => {
    const market = button.querySelector('span').textContent;
    const color = marketColors[market];
    const icon = button.querySelector('i');
    button.style.backgroundColor = color ? `${color}30` : '';
    button.style.boxShadow = color ? `inset 0 3px 0 ${color}` : '';
    icon.style.color = color || '';
  });
}

marketUniverse.addEventListener('click', event => {
  const button = event.target.closest('.pair-button');
  if (!button) return;
  const market = button.querySelector('span').textContent;
  if (!marketColorControl.hidden && selectedMarketForColor === market) {
    marketColorControl.hidden = true;
    return;
  }
  selectedMarketForColor = market;
  selectedMarketWatchlistItem = { id: `market:${selectedMarketForColor}`, type: 'Market', name: selectedMarketForColor, ticker: button.querySelector('i').textContent };
  button.after(marketColorControl);
  marketColorLabel.textContent = selectedMarketForColor;
  marketNote.value = marketNotes[selectedMarketForColor] || '';
  marketNoteSaved.textContent = '';
  marketColorControl.hidden = false;
  updateWatchlistButton(marketWatchlistButton, selectedMarketWatchlistItem);
  updateOpenTradeButton(marketOpenTradeButton, selectedMarketWatchlistItem);
  fitNoteField(marketNote);
});

marketColorChoices.forEach(choice => choice.addEventListener('click', () => {
  if (!selectedMarketForColor) return;
  marketColors[selectedMarketForColor] = choice.dataset.marketColor;
  localStorage.setItem(marketColorsKey, JSON.stringify(marketColors));
  decorateMarketColors();
  renderWatchlist();
  renderOpenTrades();
}));

clearMarketColor.addEventListener('click', () => {
  if (!selectedMarketForColor) return;
  delete marketColors[selectedMarketForColor];
  localStorage.setItem(marketColorsKey, JSON.stringify(marketColors));
  decorateMarketColors();
  renderWatchlist();
  renderOpenTrades();
});

saveMarketNote.addEventListener('click', () => {
  if (!selectedMarketForColor) return;
  marketNotes[selectedMarketForColor] = stampNote(marketNote.value);
  marketNote.value = marketNotes[selectedMarketForColor];
  localStorage.setItem(marketNotesKey, JSON.stringify(marketNotes));
  marketNoteSaved.textContent = 'Saved';
});

marketWatchlistButton.addEventListener('click', () => {
  if (!selectedMarketWatchlistItem) return;
  watchlist = isInWatchlist(selectedMarketWatchlistItem) ? watchlist.filter(item => item.id !== selectedMarketWatchlistItem.id) : [...watchlist, selectedMarketWatchlistItem];
  saveWatchlist();
  renderWatchlist();
  updateWatchlistButton(marketWatchlistButton, selectedMarketWatchlistItem);
});

marketOpenTradeButton.addEventListener('click', () => {
  if (!selectedMarketWatchlistItem) return;
  requestOpenTradeRisk(selectedMarketWatchlistItem);
});

decorateMarketColors();
const currencyColorsKey = 'trade-day-currency-colors';
const currencyColors = JSON.parse(localStorage.getItem(currencyColorsKey) || '{}');
const currencyUniverse = document.querySelector('.currency-universe');
const currencyColorControl = document.querySelector('#currencyColorControl');
const currencyColorLabel = document.querySelector('#currencyColorLabel');
const clearCurrencyColor = document.querySelector('#clearCurrencyColor');
const currencyColorChoices = [...document.querySelectorAll('.currency-color-choice')];
Object.keys(currencyColors).forEach(currency => { if (currencyColors[currency] === '#7d8580' || currencyColors[currency] === '#8b4e24') currencyColors[currency] = waitStatusColor; });
currencyColorChoices.filter(choice => choice.classList.contains('wait')).forEach(choice => { choice.dataset.currencyColor = waitStatusColor; });
const currencyNotesKey = 'trade-day-currency-notes';
const currencyNotes = JSON.parse(localStorage.getItem(currencyNotesKey) || '{}');
const currencyNote = document.querySelector('#currencyNote');
const saveCurrencyNote = document.querySelector('#saveCurrencyNote');
const currencyNoteSaved = document.querySelector('#currencyNoteSaved');
const currencyWatchlistButton = createWatchlistButton(currencyColorControl);
const currencyOpenTradeButton = createOpenTradeButton(currencyColorControl);
let selectedCurrencyForColor = null;
let selectedCurrencyWatchlistItem = null;

function decorateCurrencyColors() {
  currencyUniverse.querySelectorAll('.pair-button').forEach(button => {
    const currency = button.querySelector('span').textContent;
    const color = currencyColors[currency];
    const icon = button.querySelector('i');
    button.style.backgroundColor = color ? `${color}30` : '';
    button.style.boxShadow = color ? `inset 0 3px 0 ${color}` : '';
    icon.style.color = color || '';
  });
}

currencyUniverse.addEventListener('click', event => {
  const button = event.target.closest('.pair-button');
  if (!button) return;
  const currency = button.querySelector('span').textContent;
  if (!currencyColorControl.hidden && selectedCurrencyForColor === currency) {
    currencyColorControl.hidden = true;
    return;
  }
  selectedCurrencyForColor = currency;
  selectedCurrencyWatchlistItem = { id: `currency:${button.querySelector('i').textContent}`, type: 'Currency', name: selectedCurrencyForColor, ticker: button.querySelector('i').textContent };
  button.after(currencyColorControl);
  currencyColorLabel.textContent = selectedCurrencyForColor;
  currencyNote.value = currencyNotes[selectedCurrencyForColor] || '';
  currencyNoteSaved.textContent = '';
  currencyColorControl.hidden = false;
  updateWatchlistButton(currencyWatchlistButton, selectedCurrencyWatchlistItem);
  updateOpenTradeButton(currencyOpenTradeButton, selectedCurrencyWatchlistItem);
  fitNoteField(currencyNote);
});

currencyColorChoices.forEach(choice => choice.addEventListener('click', () => {
  if (!selectedCurrencyForColor) return;
  currencyColors[selectedCurrencyForColor] = choice.dataset.currencyColor;
  localStorage.setItem(currencyColorsKey, JSON.stringify(currencyColors));
  decorateCurrencyColors();
  renderWatchlist();
  renderOpenTrades();
}));

clearCurrencyColor.addEventListener('click', () => {
  if (!selectedCurrencyForColor) return;
  delete currencyColors[selectedCurrencyForColor];
  localStorage.setItem(currencyColorsKey, JSON.stringify(currencyColors));
  decorateCurrencyColors();
  renderWatchlist();
  renderOpenTrades();
});

saveCurrencyNote.addEventListener('click', () => {
  if (!selectedCurrencyForColor) return;
  currencyNotes[selectedCurrencyForColor] = stampNote(currencyNote.value);
  currencyNote.value = currencyNotes[selectedCurrencyForColor];
  localStorage.setItem(currencyNotesKey, JSON.stringify(currencyNotes));
  currencyNoteSaved.textContent = 'Saved';
});

currencyWatchlistButton.addEventListener('click', () => {
  if (!selectedCurrencyWatchlistItem) return;
  watchlist = isInWatchlist(selectedCurrencyWatchlistItem) ? watchlist.filter(item => item.id !== selectedCurrencyWatchlistItem.id) : [...watchlist, selectedCurrencyWatchlistItem];
  saveWatchlist();
  renderWatchlist();
  updateWatchlistButton(currencyWatchlistButton, selectedCurrencyWatchlistItem);
});

currencyOpenTradeButton.addEventListener('click', () => {
  if (!selectedCurrencyWatchlistItem) return;
  requestOpenTradeRisk(selectedCurrencyWatchlistItem);
});

decorateCurrencyColors();
function arrangeAssetActionPanel(control) {
  const title = control.querySelector('[id$="ColorLabel"]');
  const options = control.querySelector('.pair-color-options');
  const watchlistAction = control.querySelector('.watchlist-action');
  const tradeAction = control.querySelector('.trade-progress-action');
  const left = document.createElement('div');
  left.className = 'asset-actions-left';
  left.append(title, options, watchlistAction, tradeAction);
  control.prepend(left);
}
[pairColorControl, marketColorControl, currencyColorControl].forEach(arrangeAssetActionPanel);
// Asset actions are intentionally shown only for the asset currently being reviewed.
[pairColorControl, marketColorControl, currencyColorControl].forEach(control => {
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'asset-action-close';
  close.setAttribute('aria-label', 'Close asset actions');
  close.title = 'Close';
  close.textContent = 'Ã—';
  close.addEventListener('click', () => { control.hidden = true; });
  control.prepend(close);
});
const journalKey = 'trade-day-journal';
const journalForm = document.querySelector('#journalForm');
const journalEntries = document.querySelector('#journalEntries');
document.querySelector('#journalDate').value = new Date().toISOString().slice(0, 10);
const readJournal = () => JSON.parse(localStorage.getItem(journalKey) || '[]');
const writeJournal = entries => localStorage.setItem(journalKey, JSON.stringify(entries));
function renderJournal() {
  const entries = readJournal(); journalEntries.replaceChildren();
  if (!entries.length) { const empty = document.createElement('p'); empty.className = 'empty-journal'; empty.textContent = 'No journal entries yet.'; journalEntries.append(empty); return; }
  entries.forEach((entry, index) => { const row = document.createElement('article'); row.className = 'journal-entry'; const date = document.createElement('span'); date.className = 'entry-date'; date.textContent = new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${entry.date}T12:00:00`)); const main = document.createElement('div'); main.className = 'entry-main'; const title = document.createElement('strong'); title.textContent = entry.market; const setup = document.createElement('span'); setup.textContent = `${entry.direction} Â· ${entry.setup}`; main.append(title, setup); const lesson = document.createElement('p'); lesson.className = 'entry-lesson'; lesson.textContent = entry.lesson; const tag = document.createElement('span'); tag.className = 'entry-tag'; tag.textContent = entry.grade; lesson.prepend(tag, document.createElement('br')); const del = document.createElement('button'); del.className = 'delete-entry'; del.type = 'button'; del.title = 'Delete journal entry'; del.dataset.index = index; del.textContent = 'Ã—'; row.append(date, main, lesson, del); journalEntries.append(row); });
}
journalForm.addEventListener('submit', event => { event.preventDefault(); const values = Object.fromEntries(new FormData(journalForm)); const entries = readJournal(); entries.unshift(values); writeJournal(entries); journalForm.reset(); document.querySelector('#journalDate').value = new Date().toISOString().slice(0, 10); renderJournal(); });
journalEntries.addEventListener('click', event => { const button = event.target.closest('.delete-entry'); if (!button) return; if (!confirm('Are you sure you want to delete this journal entry?')) return; const entries = readJournal(); entries.splice(Number(button.dataset.index), 1); writeJournal(entries); renderJournal(); });
document.querySelector('#clearJournal').addEventListener('click', () => { if (readJournal().length && confirm('Clear all saved journal entries?')) { localStorage.removeItem(journalKey); renderJournal(); } });
renderJournal();
const todoKey = 'trade-day-todo-list';
const todoForm = document.querySelector('#todoForm');
const todoInput = document.querySelector('#todoInput');
const todoList = document.querySelector('#todoList');
const todoNavCount = document.querySelector('#todoNavCount');
const readTodos = () => JSON.parse(localStorage.getItem(todoKey) || '[]');
const writeTodos = tasks => localStorage.setItem(todoKey, JSON.stringify(tasks));
function renderTodos() {
  const manualTasks = readTodos();
  const waitingTasks = routineTasks.filter(task => task.querySelector('input[type="radio"]:checked')?.value === 'wait').map(task => ({ text: `Routine: ${task.querySelector('.task-row > span').textContent}`, routineWait: true, routineTaskId: task.dataset.taskId, status: 'wait', note: '' }));
  const tasks = [...waitingTasks, ...manualTasks.map((task, index) => ({ ...task, manualIndex: index })).filter(task => !task.cleared)];
  todoNavCount.textContent = tasks.length;
  todoNavCount.hidden = tasks.length === 0;
  todoList.replaceChildren();
  if (!tasks.length) { const empty = document.createElement('p'); empty.className = 'empty-todo'; empty.textContent = 'No tasks yet.'; todoList.append(empty); return; }
  tasks.forEach(task => {
    const row = document.createElement('label');
    row.className = `todo-item${task.routineWait ? ' routine-wait-task' : ''}`;
    const text = document.createElement('span');
    text.textContent = task.text;
    row.dataset.todoStatus = task.status || 'wait';
    if (task.routineTaskId) row.dataset.routineTaskId = task.routineTaskId;
    if (!task.routineWait) row.dataset.manualTodo = task.manualIndex;
    const controls = document.createElement('div'); controls.className = 'todo-status-controls';
    ['yes', 'no', 'wait'].forEach(status => { const button = document.createElement('button'); button.type = 'button'; button.dataset.todoStatus = status; button.textContent = status; if ((task.status || 'wait') === status) button.classList.add('active'); controls.append(button); });
    const note = document.createElement('textarea'); note.className = 'todo-note'; note.placeholder = 'Why not?'; note.value = task.note || ''; note.hidden = (task.status || 'wait') !== 'no';
    const actions = document.createElement('div'); actions.className = 'todo-status-actions'; const save = document.createElement('button'); save.type = 'button'; save.dataset.saveTodo = 'true'; save.textContent = 'Save'; actions.append(save);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.deleteTodo = task.manualIndex;
    remove.title = `Delete ${task.text}`;
    remove.textContent = 'Ã—';
    row.append(text, controls, note, actions);
    if (!task.routineWait) row.append(remove);
    todoList.append(row);
  });
}
function syncRoutineWaitTasks() { if (typeof renderTodos === 'function') renderTodos(); }
todoForm.addEventListener('submit', event => { event.preventDefault(); const text = todoInput.value.trim(); if (!text) return; const tasks = readTodos(); tasks.unshift({ text, done: false, status: 'wait', note: '' }); writeTodos(tasks); todoForm.reset(); renderTodos(); });
todoList.addEventListener('click', event => {
  const choice = event.target.closest('[data-todo-status]');
  if (choice) { const row = choice.closest('.todo-item'); const status = choice.dataset.todoStatus; row.dataset.todoStatus = status; row.querySelectorAll('[data-todo-status]').forEach(button => button.classList.toggle('active', button === choice)); row.querySelector('.todo-note').hidden = status !== 'no'; if (status !== 'yes') return; if (row.dataset.routineTaskId) { const routineTask = routineTasks.find(task => task.dataset.taskId === row.dataset.routineTaskId); routineTask.querySelector('input[type="radio"][value="yes"]').checked = true; routineTask.querySelector('.no-reason').hidden = true; updateScore(); return; } const tasks = readTodos(); const task = tasks[Number(row.dataset.manualTodo)]; task.status = 'yes'; task.note = ''; task.cleared = true; writeTodos(tasks); renderTodos(); return; }
  const save = event.target.closest('[data-save-todo]');
  if (save) { const row = save.closest('.todo-item'); const status = row.dataset.todoStatus; const note = row.querySelector('.todo-note').value.trim(); if (row.dataset.routineTaskId) { const routineTask = routineTasks.find(task => task.dataset.taskId === row.dataset.routineTaskId); const radio = routineTask.querySelector(`input[type="radio"][value="${status}"]`); radio.checked = true; routineTask.querySelector('textarea').value = note; routineTask.querySelector('.no-reason').hidden = status !== 'no'; updateScore(); return; } const tasks = readTodos(); const task = tasks[Number(row.dataset.manualTodo)]; task.status = status; task.note = note; task.cleared = status !== 'wait'; writeTodos(tasks); renderTodos(); return; }
  const remove = event.target.closest('[data-delete-todo]'); if (!remove) return; if (!confirm('Are you sure you want to delete this To-do task?')) return; const tasks = readTodos(); tasks.splice(Number(remove.dataset.deleteTodo), 1); writeTodos(tasks); renderTodos();
});
renderTodos();
updateScore();
