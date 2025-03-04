// Configure Jest to use fake timers by default
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});