const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

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
}
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const findUserByEmail = (email) => {
  for (key in users) {
      if (users[key].email === email) {
          return users[key];
      }
  }
  return null;

};

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}
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
  const user = users[req.cookies["user_id"]];
  const templateVars = {user, urls: urlDatabase};
  res.render('urls_index', templateVars);
});
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls')
});
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {user};
  res.render("urls_new", templateVars);
});
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {user, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
app.post('/urls', (req, res) => {
  console.log(req.body);
  // res.send('Ok');
  const randomlyGeneratedShortURL = generateRandomString();
  urlDatabase[randomlyGeneratedShortURL] = req.body.longURL;
  res.redirect(`/urls/${randomlyGeneratedShortURL}`);
});
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newURL = req.body.newURL;
  urlDatabase[id] = newURL;
  res.redirect('/urls')
});
// app.post('/login', (req, res) => {
//   const username = req.body.username;
//   res.cookie('username', username);
//   res.redirect('/urls');
// });
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})
app.get('/register', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {user};
  res.render('register', templateVars);
})
app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    res.status(400).send('Bad request, please fill out both fields.');
    return;
  }
  const foundUser = findUserByEmail(email);
  if(foundUser) {
    res.status(400).send('Bad request, the entered email already exists. Try to login instead.');
    return;
  }
  const randomlyGeneratedId = generateRandomString();
  users[randomlyGeneratedId] = {
    id: randomlyGeneratedId,
    email,
    password
  };
  console.log(users);
  res.cookie('user_id', randomlyGeneratedId);
  res.redirect('/urls');
})

app.get('/login', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {user};
  res.render('login', templateVars);
});
app.post('/login', (req, res) => {
  console.log(req.body);
  const {email, password} = req.body;
  const foundUser = findUserByEmail(email);
  // console.log(foundUser);
  console.log("FOUND USER <----", foundUser);
    if (foundUser) {
      // check their pass
      if(foundUser.password === password) {
        console.log('Password entered matched the pass of foundUser!')
        res.cookie('user_id', foundUser.id);
        res.redirect(`/urls`);
        return;
      }
      res.status(403).send('Wrong password. Please try again.')
      return;
        // if pass maches what they user inputed in the form (req.body.password)
        // set a cookie
        // if not tell em to go away!
        // res.send('found user!!  :)');
    } else {
        res.status(403).send('user does not exist :(');
        return;
    }
})
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});