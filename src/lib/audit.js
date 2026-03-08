import { getDeck, getFolder, getUserDecks } from './archidekt';
import { checkCard } from './scryfall';

const MAX_CARD_CONCURRENCY = 5;

function expandCards(cards) {
  return cards.flatMap((card) => Array(card.quantity).fill(card.name));
}

function aborted(signal) {
  return signal?.aborted;
}

async function auditDeckCards(cardNames, { onCardResult, signal }) {
  const totals = { banned: 0, legal: 0, failed: 0 };
  let index = 0;

  const workers = Array.from({ length: Math.min(MAX_CARD_CONCURRENCY, cardNames.length) }, () => (async () => {
    while (index < cardNames.length && !aborted(signal)) {
      const currentIndex = index;
      index += 1;

      const cardName = cardNames[currentIndex];
      const result = await checkCard(cardName);

      if (aborted(signal)) {
        return;
      }

      const status = result?.result ?? 'failed';
      onCardResult?.({ cardName, status });

      if (status === 'banned') {
        totals.banned += 1;
      } else if (status === 'legal') {
        totals.legal += 1;
      } else {
        totals.failed += 1;
      }
    }
  })());

  await Promise.all(workers);
  return totals;
}

export async function auditCard(cardName, { onResult }) {
  onResult?.({ cardName, status: 'checking' });
  const result = await checkCard(cardName);
  onResult?.({ cardName, status: result?.result ?? 'failed', reason: result?.reason });
}

export async function auditDeck(deckId, { onDeckInfo, onCardResult, onComplete, onError, signal }) {
  try {
    if (aborted(signal)) {
      return;
    }

    const deck = await getDeck(deckId);
    const expandedCards = expandCards(deck.cards);

    if (aborted(signal)) {
      return;
    }

    onDeckInfo?.({ id: deck.id, name: deck.name, totalCards: expandedCards.length });

    const totals = await auditDeckCards(expandedCards, { onCardResult, signal });

    if (aborted(signal)) {
      return;
    }

    onComplete?.(totals);
  } catch (error) {
    onError?.(error);
  }
}

async function auditDeckList(decks, handlers) {
  for (const deck of decks) {
    if (aborted(handlers.signal)) {
      break;
    }

    handlers.onDeckStart?.({ id: deck.id, name: deck.name });

    await auditDeck(deck.id, {
      signal: handlers.signal,
      onDeckInfo: handlers.onDeckInfo,
      onCardResult: (cardResult) => {
        handlers.onDeckCardResult?.({ deckId: deck.id, deckName: deck.name, ...cardResult });
      },
      onComplete: (totals) => {
        handlers.onDeckComplete?.({ deckId: deck.id, deckName: deck.name, ...totals });
      },
      onError: handlers.onError,
    });
  }
}

export async function auditFolder(folderId, { onFolderInfo, onDeckStart, onDeckCardResult, onDeckComplete, onError, signal }) {
  try {
    const folder = await getFolder(folderId);
    onFolderInfo?.({ id: folder.id, name: folder.name, totalDecks: folder.decks.length });

    await auditDeckList(folder.decks, {
      signal,
      onDeckStart,
      onDeckCardResult,
      onDeckComplete,
      onError,
    });
  } catch (error) {
    onError?.(error);
  }
}

export async function auditUser(username, { onFolderInfo, onDeckStart, onDeckCardResult, onDeckComplete, onError, signal }) {
  try {
    const decks = await getUserDecks(username);
    onFolderInfo?.({ id: username, name: username, totalDecks: decks.length });

    await auditDeckList(decks, {
      signal,
      onDeckStart,
      onDeckCardResult,
      onDeckComplete,
      onError,
    });
  } catch (error) {
    onError?.(error);
  }
}
