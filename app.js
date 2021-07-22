require('dotenv').config();
const express = require(`express`);
const ejs = require(`ejs`);
const mongoose = require(`mongoose`);
const session = require('express-session');
const passport = require(`passport`);
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate')
//express
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//express-session

app.use(session({
  secret: `Our little secret.`,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//ejs
app.set('view engine', 'ejs');

//mongoose

const url = `mongodb+srv://admin:mtgezgin01@gettingstarted.tkhrp.mongodb.net/userDB?retryWrites=true&w=majority`;
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model(`User`, userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.route(`/`)

  .get((req, res) => {
    res.render(`home`);
  })

app.route(`/login`)

  .get((req, res) => {
    res.render(`login`);
  })

  //Kendime not bu şekilde yapılabilmesinin sebebini passport.js'de  Username & Password kısmında anlatıyor.
  .post(passport.authenticate(`local`, {
    successRedirect: '/secrets',
    failureRedirect: '/login'
  }));

// this is the original login route (with the bug):
// app.post("/login",function(req,res){
//     const user = new User({
//         username: req.body.username,
//         password: req.body.password
//     });
//     req.login(user, function(err){
//         if(err) {
//             console.log(err);
//         } else {
//             passport.authenticate("local")(req, res, function(){
//                 res.redirect("/secrets");
//             });
//         }
//     });
// });

app.route(`/register`)

  .get((req, res) => {
    res.render(`register`);
  })

  .post((req, res, next) => {
    const email = req.body.username;
    const password = req.body.password;

    User.register({
      username: email
    }, password, (err, user) => {
      if (err) {
        console.log(err);
        res.redirect(`/register`);
      } else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }
          return res.redirect('/secrets');
        });
      }
    });

  });

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.route(`/secrets`)

  .get((req, res) => {
    res.set(
      'Cache-Control',
      'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    User.find({"secret": {$ne:null}}, (err, foundUsers) => {
      if (err) {
        console.log(err);
      }else {
        res.render("secrets", {usersWithSecrets: foundUsers})
      }
    });
    // if (req.isAuthenticated()) {
    //   res.render(`secrets`);
    // } else {
    //   res.redirect(`/login`);
    // }
  });

app.route(`/submit`)

  .get((req, res) => {
    res.set(
      'Cache-Control',
      'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    if (req.isAuthenticated()) {
      res.render(`submit`);
    } else {
      res.redirect(`/login`);
    }
  })

  .post((req, res) => {
    const submittedContent = req.body.secret;
    User.findById(req.user.id.match(/^[0-9a-fA-F]{24}$/), (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedContent;
          foundUser.save((err) => {
            if (err) {
              console.log(err);
            } else {
              res.redirect(`/secrets`);
            }

          });
        }
      }
    })
  });

app.route(`/logout`)

  .get((req, res) => {
    req.logout();
    res.redirect('/');
  })
app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening at http://${process.env.PORT || port}`);
})
