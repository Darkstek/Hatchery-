const jwt = require("jsonwebtoken");
 
const jwtAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
 
  if (!token) {
    return res.status(401).json({ error: "Přístup odepřen - chybí token" });
  }
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Neplatný token" });
  }
};
 
module.exports = jwtAuth;
 