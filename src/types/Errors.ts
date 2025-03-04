export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class GraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphError';
  }
}

export class TripleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TripleError';
  }
}