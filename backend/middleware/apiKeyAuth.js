const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
 
  if (!apiKey || apiKey !== process.env.GATEWAY_API_KEY) {
    return res.status(401).json({ error: "Neplatný nebo chybějící API klíč" });
  }
 
  next();
};
 
module.exports = apiKeyAuth;
 