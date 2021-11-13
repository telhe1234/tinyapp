const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const cookieSession = require('cookie-session');

const { getUserByEmail, findUrlsForCurrentUser, generateRandomString } = require('./helpers');



app.set('view engine', 'ejs');


app.use(cookieSession({
  name: "session",
	keys: ["I like security it's the best", "key2"]
}));
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


app.get("/", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];

  if (!user) {
    return res.redirect('/login');
  }

  return res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a> first.");
  }

  const urls = findUrlsForCurrentUser(userID, urlDatabase);
  const templateVars = {user, urls};

  res.render('urls_index', templateVars);
});

app.get('/login', (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect('/urls');
  }
  const templateVars = {user};
  res.render('login', templateVars);
});

app.get('/register', (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];

  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {user};
  res.render('register', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log(urlDatabase[shortURL]);
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Not Found! Please enter a valid shortURL.');
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect('/login');
  }
  res.render("urls_new", { user });
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  const user = users[userID];

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a> to edit a URL.");
  }
  if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== userID) {
    return res.status(400).send("Wrong URL! <a href='/urls'>Try Again</a> by pressing on edit button of the URL you want to see.");
  }

  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {user, shortURL, longURL};
  res.render("urls_show", templateVars);
});

app.post('/urls', (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a>");
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const url = {longURL, userID};
  urlDatabase[shortURL] = url;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  const user = users[userID];

  if (!user) {
    return res.status(400).send("Please <a href='/login'>login</a> to delete a URL.");
  }
  if (urlDatabase[shortURL].userID !== userID) {
    return res.status(400).send("Wrong URL");
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
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
  delete req.session.user_id;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return res.status(400).send("Please fill out both fields. <a href='/register'>Try again</a>");
  }
  if (getUserByEmail(email, users)) {
    return res.status(400).send("The entered email already exists. <a href='/register'>Try again</a>");
  }

  const id = generateRandomString();
  const user = { id, email, password: bcrypt.hashSync(password, salt) };
  users[id] = user;
  req.session.user_id =  id;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  const foundUser = getUserByEmail(email, users);

  if (!foundUser || !bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send("Invalid credentials. Please <a href=/login>try again</a>.");
  }

  req.session.user_id = foundUser.id;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});