export class ArchidektError extends Error {
  constructor(reason, detail) {
    super(`Archidekt error: ${reason}${detail ? ` (${detail})` : ''}`);
    this.name = 'ArchidektError';
    this.reason = reason;
    this.detail = detail;
  }
}

export class ScryfallError extends Error {
  constructor(reason) {
    super(`Scryfall error: ${reason}`);
    this.name = 'ScryfallError';
    this.reason = reason;
  }
}
