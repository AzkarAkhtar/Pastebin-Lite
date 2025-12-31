export const getNow = (req) => {
  if (process.env.TEST_MODE === '1') {
    const header = req.header('x-test-now-ms');
    if (header) {
      const ms = Number(header);
      if (!Number.isNaN(ms) && ms > 0) {
        return new Date(ms);
      }
    }
  }
  return new Date();
};