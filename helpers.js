const getUserByEmail = (email, database) => {
  for (const key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;

}

const findUrlsForCurrentUser = (id, urlDatabase) => {
  const results = {};
  const keys = Object.keys(urlDatabase);
  for (const shortURL of keys) {
    const url = urlDatabase[shortURL];
    if (url.userID === id) {
      results[shortURL] = url;
    }
  }
  return results;
}

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

module.exports = {getUserByEmail, findUrlsForCurrentUser, generateRandomString};