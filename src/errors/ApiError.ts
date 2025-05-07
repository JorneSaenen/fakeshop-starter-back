export class ApiError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.statusCode = statusCode;

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
