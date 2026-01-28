import jwt from "jsonwebtoken";

const authSeller = (req, res, next) => {
  try {
    const sellerToken = req.cookies?.sellerToken;

    // 1️⃣ Token missing
    if (!sellerToken) {
      return res.status(401).json({
        success: false,
        message: "Seller not authorized (token missing)",
      });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET);

    // 3️⃣ Validate role
    if (!decoded || decoded.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access denied",
      });
    }

    // 4️⃣ Attach seller info (optional but useful)
    req.sellerId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export default authSeller;
