export class InappropriateContentException extends Error {
  constructor() {
    super('Content violates community guidelines');
    this.name = 'InappropriateContentException';
  }
}
