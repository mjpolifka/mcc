import { ArchidektError } from './errors';

const SERVER_PROXY_BASE = '/api/archidekt';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function archidektFetch(path, retries = 2, attempt = 0) {
  try {
    const response = await fetch(`${SERVER_PROXY_BASE}${path}`);

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

    const looksLikeCors = error instanceof TypeError;
    const detail = looksLikeCors
      ? 'request blocked before response (likely local proxy/network issue)'
      : 'unable to reach Archidekt API through server proxy';

    if (attempt >= retries) {
      throw new ArchidektError('network', detail);
    }

    await sleep(250 * (attempt + 1));
    return archidektFetch(path, retries, attempt + 1);
  }
}

function parseDeckCards(payload) {
  // Expected shape from Archidekt deck response:
  // cards: [{ quantity, card: { oracleCard: { name } } }]
  if (!Array.isArray(payload?.cards)) {
    throw new ArchidektError('api_changed');
  }

  return payload.cards
    .map((entry) => {
      const quantity = Number(entry?.quantity);
      const name = entry?.card?.oracleCard?.name;

      if (!name || !Number.isFinite(quantity)) {
        return null;
      }

      return { name, quantity: Math.max(0, Math.floor(quantity)) };
    })
    .filter((entry) => entry && entry.quantity > 0);
}

export async function getDeck(deckId) {
  const payload = await archidektFetch(`/decks/${deckId}/`);

  if (!payload?.id || !payload?.name) {
    throw new ArchidektError('api_changed');
  }

  return {
    id: payload.id,
    name: payload.name,
    cards: parseDeckCards(payload),
  };
}

export async function getFolder(folderId) {
  const payload = await archidektFetch(`/folders/${folderId}/`);

  // Expected folder shape includes decks: [{ id, name }]
  if (!payload?.id || !payload?.name || !Array.isArray(payload?.decks)) {
    throw new ArchidektError('api_changed');
  }

  return {
    id: payload.id,
    name: payload.name,
    decks: payload.decks
      .map((deck) => ({ id: deck?.id, name: deck?.name }))
      .filter((deck) => deck.id && deck.name),
  };
}

export async function getUserDecks(username) {
  const payload = await archidektFetch(`/users/${encodeURIComponent(username)}/decks/`);

  // Expected paginated shape: { results: [{ id, name, updatedAt|updated_at }] }
  if (!Array.isArray(payload?.results)) {
    throw new ArchidektError('api_changed');
  }

  return payload.results
    .map((deck) => ({
      id: deck?.id,
      name: deck?.name,
      updatedAt: deck?.updatedAt ?? deck?.updated_at ?? null,
    }))
    .filter((deck) => deck.id && deck.name);
}
