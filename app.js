require('dotenv').config();
const express = require(`express`);
const ejs = require(`ejs`);
const mongoose = require(`mongoose`);
var encrypt = require('mongoose-encryption');
//express
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//ejs
app.set('view engine', 'ejs');

//mongoose

const url = `mongodb+srv://admin:mtgezgin01@gettingstarted.tkhrp.mongodb.net/userDB?retryWrites=true&w=majority`;
mongoose.set('useFindAndModify', false);
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});


userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ['password']
});

const User = mongoose.model(`User`, userSchema);


app.route(`/`)

  .get((req, res) => {
    res.render(`home`);
  })

app.route(`/login`)

  .get((req, res) => {
    res.render(`login`);
  })

  .post((req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    User.findOne({
      email: email
    }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          console.log(foundUser.password);

          if (foundUser.password === password) {
            res.render(`secrets`);
          }
        }
      }
    });
  });

app.route(`/register`)

  .get((req, res) => {
    res.render(`register`);
  })

  .post((req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    const newUser = new User({
      email: email,
      password: password
    });
    newUser.save((err) => {
      if (!err) {
        res.render(`secrets`);
      } else {
        res.send(err);
      }
    });
  });

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening at http://${process.env.PORT || port}`);
})
