
import NodeCache from 'node-cache';

export const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120
});

export const cacheMiddleware = (duration: number) => {
  return (req: any, res: any, next: any) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    res.originalJson = res.json;
    res.json = (body: any) => {
      cache.set(key, body, duration);
      res.originalJson(body);
    };
    next();
  };
};
