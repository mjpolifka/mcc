export class ArchidektError extends Error {
  constructor(reason) {
    super(`Archidekt error: ${reason}`);
    this.name = 'ArchidektError';
    this.reason = reason;
  }
}

export class ScryfallError extends Error {
  constructor(reason) {
    super(`Scryfall error: ${reason}`);
    this.name = 'ScryfallError';
    this.reason = reason;
  }
}
