var express = require('express');
var app = express();
var db = require('./models');
var bodyParser = require('body-parser');
var session = require('express-session');
var User = require('./models/user.js');
const yelp = require('yelp-fusion');

var currentUserLocation = {
  "lat": null,
  "lng": null
}
var client;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  saveUninitialized: true,
  resave: true,
  secret: 'VladsIngredientSuperSecretCookie',
  cookie: { maxAge: 30 * 60 * 1000 } // 30 minute cookie lifespan (in milliseconds)
}));
app.use(function(req, res, next){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

var thisUser;
function currentUser(req){
  db.User.findOne({_id:req.session.userId}, function(err, user){
    thisUser = user;
  });
  return thisUser
}

app.get('/', function(req, res){
  if(currentUser(req)){
    res.redirect('/profile');
  }
  else{
    currentUser["lat"] = null;
    currentUser["lng"] = null;
    res.sendFile(__dirname + '/views/login_signup.html');
  }
});

app.post('/signup', function(req, res){
    User.createSecure(req.body.name, req.body.email, req.body.dob, req.body.password, function(err, user){
      if(err){console.log(err);}
      res.json(user);
    });
});

app.post('/login', function(req, res){
  User.authenticate(req.body.email, req.body.password, function(err, user){
    req.session.userId = user._id
    res.json(user);
  });
});

app.get('/logout', function(req, res){
  req.session.userId = null;
  res.redirect('/');
});

app.get("/profile", function(req, res){
  if(!currentUser(req)){
    res.redirect('/');
  }
  else{
    res.sendFile(__dirname + '/views/profile.html');
  }
});

app.get("/getUser", function(req, res){
  db.User.findOne({_id: req.session.userId}, function(err, user){
    res.json(user);
  });
});

app.get('/setcurrentlocation', function(req, res){
  currentUserLocation["lat"] = req.query.lat;
  currentUserLocation["lng"] = req.query.lng;
});

app.get('/position', function(req, res){
  res.json({lat:currentUserLocation["lat"], lng:currentUserLocation["lng"]});
});

app.get("/places", function(req,res){
  if(!currentUser(req)){
    res.redirect('/');
  }
  else{
    res.sendFile(__dirname + '/views/places.html');
  }
});

app.get("/getyelpdata", function(req,res){
  yelp.accessToken("zlyKmaUcKVM3dc3lQQjfjQ", "xq4eOIaI6Lqupx1X0WYi5JD0ZuHm4VQLlpxxBMGT93btB7AQ86csvScdMD2yLC2d").then(response => {
    client = yelp.client(response.jsonBody.access_token);

    client.search({
      term:'Night clubs',
      location: 'san francisco, ca',
      // latitude: currentUserLocation["lat"],
      // longitude: currentUserLocation["lng"],
      radius: 7000,
      limit:6
    }).then(response => {
      res.json(response);
    });
  }).catch(e => {
    console.log(e);
  });
});

app.post('/findorcreate', function(req,res){
  db.Place.findOne({yelp_id: req.body.id}, function(err, foundPlace){
    if(!foundPlace){
      client.business(req.body.id).then(function(detailedInfoPlace){
        var newPlace = new db.Place({
          yelp_id: req.body.id,
          is_open_now: detailedInfoPlace.jsonBody["hours"][0].is_open_now,
          currentPost: null
        });
        newPlace.save();

        var newPost = new db.Post({
            date: new Date(),
            rating: 0,
            placeId: newPlace._id
        });
        newPost.save();

        newPlace.currentPost = newPost._id;
        newPlace.save();
        res.json(newPlace);
      }).catch(e => {
        console.log(e);
      });
    }
    else{
      res.json(foundPlace);
    }
  });
});

app.get('/getpost', function(req, res){
  db.Place.findOne({yelp_id: req.query.clubId}, function(err, place){
    db.Post.findOne({_id: place.currentPost}, function(err, post){
      res.json(post);
    })
  });
});

var server = app.listen(process.env.PORT || 3000)
