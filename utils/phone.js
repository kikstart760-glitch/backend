const { parsePhoneNumberFromString } = require("libphonenumber-js");

const formatPhone = (phone) => {
  try {
    const parsed = parsePhoneNumberFromString(phone, "IN");

    if (!parsed || !parsed.isValid()) return null;

    return parsed.number;
  } catch {
    return null;
  }
};

module.exports = { formatPhone };