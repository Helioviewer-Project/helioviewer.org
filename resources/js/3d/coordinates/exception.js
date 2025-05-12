class AppException extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

export { AppException };
