const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);


// middleware making a log at the terminal
// const morgan = require('morgan');

app.set('view engine', 'ejs');

// morgan middleware allows to log the request in the terminal
// app.use(morgan('short'));

app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "user2RandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

const findUserByEmail = (email) => {
  for (const key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return null;

};

const findUrlsForCurrentUser = (id) => {
  const results = {};
  const keys = Object.keys(urlDatabase);
  for (const shortURL of keys) {
    const url = urlDatabase[shortURL];
    if (url.userID === id) {
      results[shortURL] = url;
    }
  }
  return results;
};

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id]

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a> first.");
  }

  const urls = findUrlsForCurrentUser(user_id);
  const templateVars = {user, urls}

  res.render('urls_index', templateVars);
});

app.get('/login', (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (user) {
    return res.redirect('/urls');
  }
  const templateVars = {user};
  res.render('login', templateVars);
});

app.get('/register', (req, res) => {
  const id = req.cookies["user_id"]
  const user = users[id];

  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {user};
  res.render('register', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Not Found! Please enter a valid shortURL.');
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  if (!user) {
    res.redirect('/login');
    return;
  }
  res.render("urls_new", { user });
});

app.get("/urls/:shortURL", (req, res) => {
  const {shortURL} = req.params;
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const userID = req.cookies["user_id"];
  const user = users[userID];

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a> to edit a URL.");
  }
  if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== userID) {
    return res.status(400).send("Wrong URL");
  }

  const templateVars = {user, shortURL, longURL};
  res.render("urls_show", templateVars);
});

app.post('/urls', (req, res) => {
  const user_id = req.cookies["user_id"];
  if (!user_id) {
    res.status(400).send("Please <a href='/login'>login</a>");
    return;
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const url = {longURL, userID : user_id};
  urlDatabase[shortURL] = url;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies['user_id'];
  const user = users[userID];

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a> to delete a URL.");
  }
  if (urlDatabase[shortURL].userID !== userID) {
    return res.status(400).send("Wrong URL");
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls')
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const userID = req.cookies['user_id'];
  const user = users[userID];

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a> to edit a URL.");
  }
  if (!urlDatabase[id] || urlDatabase[id].userID !== userID) {
    return res.status(400).send("Wrong URL");
  }

  const newLongURL = req.body.newLongURL;
  urlDatabase[id].longURL = newLongURL;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    res.status(400).send("Please fill out both fields. <a href='/register'>Try again</a>");
    return;
  }
  if(findUserByEmail(email)) {
    res.status(400).send("The entered email already exists. <a href='/register'>Try again</a>");
    return;
  }

  const id = generateRandomString();
  const user = { id, email, password: bcrypt.hashSync(password, salt) };
  users[id] = user;
  console.log("user DB:", users);
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  const foundUser = findUserByEmail(email);
  if (!foundUser || !bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send("Invalid credentials. Please <a href=/login>try again</a>.");
  }
  res.cookie('user_id', foundUser.id);
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});