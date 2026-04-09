const UAParser = require("ua-parser-js");
const axios = require("axios");

// ✅ Get Device Info
const getDevice = (req) => {
  try {
    const ua = req.headers["user-agent"] || "";
    const parser = new UAParser(ua);
    const result = parser.getResult();

    return `${result.browser.name || "Unknown"} on ${
      result.os.name || "Unknown OS"
    }`;
  } catch {
    return "Unknown Device";
  }
};

// ✅ Get Real IP Address
const getIP = (req) => {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  // handle multiple IPs (proxy case)
  if (ip.includes(",")) {
    ip = ip.split(",")[0];
  }

  // remove IPv6 prefix
  if (ip.includes("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip || "Unknown IP";
};

// ✅ Get Location from IP
const getLocation = async (ip) => {
  try {
    // ❌ skip local IP
    if (!ip || ip === "127.0.0.1" || ip === "::1") {
      return "Localhost";
    }

    const res = await axios.get(`http://ip-api.com/json/${ip}`);

    if (res.data.status === "fail") {
      return "Unknown Location";
    }

    return `${res.data.city || "Unknown"}, ${
      res.data.country || "Unknown"
    }`;
  } catch {
    return "Unknown Location";
  }
};

module.exports = { getDevice, getIP, getLocation };