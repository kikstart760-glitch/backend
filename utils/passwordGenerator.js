const crypto = require("crypto");

function generatePassword(length = 16) {
  if (length < 4) {
    throw new Error("Password length must be at least 4");
  }

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=";

  const allChars = uppercase + lowercase + numbers + special;

  const passwordChars = [
    uppercase[crypto.randomInt(uppercase.length)],
    lowercase[crypto.randomInt(lowercase.length)],
    numbers[crypto.randomInt(numbers.length)],
    special[crypto.randomInt(special.length)],
  ];

  while (passwordChars.length < length) {
    passwordChars.push(allChars[crypto.randomInt(allChars.length)]);
  }

  // Shuffle characters
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);

    [passwordChars[i], passwordChars[j]] = [
      passwordChars[j],
      passwordChars[i],
    ];
  }

  return passwordChars.join("");
}

module.exports = { generatePassword };