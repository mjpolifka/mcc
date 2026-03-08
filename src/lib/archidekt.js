import { ArchidektError } from './errors';

const BASE_URL = 'https://archidekt.com/api';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function archidektFetch(path, retries = 2, attempt = 0) {
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url);

    if (response.status === 404 || response.status === 403) {
      throw new ArchidektError('not_found');
    }

    if (!response.ok) {
      throw new ArchidektError('api_changed');
    }

    return response.json();
  } catch (error) {
    if (error instanceof ArchidektError) {
      throw error;
    }

    if (attempt >= retries) {
      throw new ArchidektError('network');
    }

    await sleep(250 * (attempt + 1));
    return archidektFetch(path, retries, attempt + 1);
  }
}

function parseDeckCards(rawDeck) {
  const cardRows = Array.isArray(rawDeck?.cards)
    ? rawDeck.cards
    : Array.isArray(rawDeck?.cardMap)
      ? rawDeck.cardMap
      : null;

  if (!cardRows) {
    throw new ArchidektError('api_changed');
  }

  return cardRows
    .map((row) => {
      const quantity = row?.quantity ?? row?.qty ?? row?.amount ?? 1;
      const name = row?.card?.oracleCard?.name ?? row?.card?.name ?? row?.name;

      if (!name) {
        return null;
      }

      return { name, quantity: Number(quantity) || 1 };
    })
    .filter(Boolean);
}

export async function getDeck(deckId) {
  const payload = await archidektFetch(`/decks/${deckId}/`);

  if (!payload?.id || !payload?.name) {
    throw new ArchidektError('api_changed');
  }

  const cards = parseDeckCards(payload);

  return {
    id: payload.id,
    name: payload.name,
    cards,
  };
}

export async function getFolder(folderId) {
  const payload = await archidektFetch(`/folders/${folderId}/`);

  const deckRows = Array.isArray(payload?.decks) ? payload.decks : payload?.results;
  if (!payload?.id || !payload?.name || !Array.isArray(deckRows)) {
    throw new ArchidektError('api_changed');
  }

  const decks = deckRows
    .map((deck) => ({ id: deck?.id, name: deck?.name }))
    .filter((deck) => deck.id && deck.name);

  return {
    id: payload.id,
    name: payload.name,
    decks,
  };
}

export async function getUserDecks(username) {
  const payload = await archidektFetch(`/users/${encodeURIComponent(username)}/decks/`);

  const decks = Array.isArray(payload?.results) ? payload.results : payload;
  if (!Array.isArray(decks)) {
    throw new ArchidektError('api_changed');
  }

  return decks
    .map((deck) => ({
      id: deck?.id,
      name: deck?.name,
      updatedAt: deck?.updatedAt ?? deck?.updated_at ?? null,
    }))
    .filter((deck) => deck.id && deck.name);
}
