require('dotenv').config();
const { Schema } = require('mongoose');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const express = require('express')
const app = express()
const cors = require('cors')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [{
    description: String,
    duration: Number,
    date: String
  }],
  count: Number
});
let User = mongoose.model("Users", userSchema);

app.route('/api/users')
  .post((req, res) => {
    const user = new User({ username: req.body.username });
    user.save((err, data) => {
      if (err) console.log("ERROR 1!")
      res.json(data)
    })
  })
  .get((req, res) => {
    User.find((err, data) => {
      if (err) return console.log("ERROR 2!")
      res.json(data)
    })
  })

app.post('/api/users/:_id/exercises', (req, res) => {

  let { description, duration, date } = req.body;
  let id = req.params._id;
  duration = parseInt(duration);
  if (!date) date = new Date().toDateString();
  else date = new Date(req.body.date).toDateString();
  const exercise = {
    date,
    duration,
    description
  }
  User.findById(id, (err, user) => {
    user.log.push(exercise);
    if (err) return console.log("ERROR 3!")
    user.save((err, user) => {
      if (err) return console.log("ERROR 4!")
      const reobj = {
        _id: id,
        username: user.username,
        ...exercise
      };
      res.json(reobj);
    })
  })
});

app.route('/api/users/:_id/logs')
  .get((req, res) => {
    User.findById(req.params._id, (err, user) => {
      if (user) {
        user.count = user.log.length;
        if (req.query.from || req.query.to) {
          const from = new Date(req.query.from);
          const to = new Date(req.query.to);
          user.log = user.log.filter(log => {
            const date = new Date(log.date);
            return (date >= from && date <= to);
          });
        }
        if (req.query.limit) user.log = user.log.slice(0, req.query.limit);
        res.json(user);
      }
    })
  })
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
