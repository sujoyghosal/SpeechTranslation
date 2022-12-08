// Loads the configuration from config.env to process.env
const express = require("express");
const mongodb = require("mongodb");
const recordRoutes = express.Router();
var http = require("http");
const cors = require("cors");
// get MongoDB driver connection
//const dbo = require("./db/conn");
const PORT = process.env.PORT || 5555;
const app = express();
var loggedinUsers = [];
app.use(cors());
app.use(express.json());
//app.use(require("./routes/record"));
// Imports the Google Cloud client library
const { Translate } = require("@google-cloud/translate").v2;

// Creates a client
const translate = new Translate();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
// const text = 'The text to translate, e.g. Hello, world!';
//const target = "hi";

async function translateText(text, target) {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  let [translations] = await translate.translate(text, target);
  translations = Array.isArray(translations) ? translations : [translations];
  console.log("Translations:");
  translations.forEach((translation, i) => {
    console.log(`${text[i]} => (${target}) ${translation}`);
    console.log("Translated text: " + translations);
    mysocket.emit("event", { lang: target, text: translations });
  });
}

translateText();
// Global error handling
app.use(function (err, _req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
const { MongoClient } = require("mongodb");
const connectionString =
  process.env.ATLAS_URI ||
  "mongodb+srv://sujoy:Delhi123@cluster0.omxq6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;
client.connect(function (err, db) {
  if (err || !db) {
    return err;
  }
  dbConnection = db.db("DonationDB");
  console.log("Successfully connected to MongoDB - DonationsDB");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/users", (req, res) => {
  dbConnection
    .collection("Users")
    .find({
      email: {
        $eq: req.query.email,
      },
    })
    .limit(50)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching users!");
      } else {
        res.json(result);
      }
    });
});
app.get("/login", (req, res) => {
  dbConnection
    .collection("Users")
    .find({
      email: {
        $eq: req.query.email,
      },
    })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching user");
        console.log("Failed login for " + req.query.email);
      } else {
        //res.json(result);
        console.log("Login response: " + JSON.stringify(response));
        if (
          result &&
          result.length > 0 &&
          checkPassword(req.query.password, result[0].pw)
        ) {
          res.status(200).jsonp(result[0]);
          console.log("Success login for " + req.query.email);
        } else {
          res.status(400).send([]);
          console.log("Failed login for " + req.query.email);
        }
      }
    });
});

async function getUserByEmail(email) {
  if (!email || email == null || email.length < 3) {
    console.log("GetUserByEmail: Not a valid email");
    return;
  }
  dbConnection
    .collection("User")
    .find({
      email: {
        $eq: email,
      },
    })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        console.log("Error fetching user!" + err);
        return null;
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          console.log("Email already exists " + result[0]);
          return true;
        } else return false;
      }
    });
}
var bcrypt = require("bcrypt");
const { response } = require("express");
var encryptedPw = "null";

function encryptPassword(password) {
  const saltRounds = 10;
  const myPlaintextPassword = password;
  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(myPlaintextPassword, salt);
  encryptedPw = hash;
  console.log("Encrypted password=" + hash);
  return hash;
}

function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
  //return true;
}
// This section will help you create a new record.
app.post("/users/insert", (req, res) => {
  var email = req.body.email;
  if (!email || email == null || email.length < 3) {
    console.log("Not a valid email");
    return;
  }
  console.log(JSON.stringify(req.body));
  dbConnection
    .collection("Users")
    .find({
      email: {
        $eq: email,
      },
    })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        console.log("Error fetching user!" + err);
        return null;
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          console.log("Email already exists " + JSON.stringify(result[0]));
          res.status(400).send("Email Exists");
          return;
        } else {
          encryptedPw = encryptPassword(req.body.password);
          const userDocument = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            //address: req.body.address,
            pw: encryptedPw,
            ngo: req.body.ngo ? req.body.ngo : false,
            create_time: new Date(),
          };

          dbConnection
            .collection("Users")
            .insertOne(userDocument, function (err, result) {
              if (err) {
                console.error(JSON.stringify(err));
                res.status(400).send("Error inserting user data!");
              } else {
                console.log(`Added a new user with id ${result.insertedId}`);
                res.status(201).send("Success");
              }
            });
        }
      }
    });
});

// This section will help you update a record by id.
app.put("/users/update"),
  (req, res) => {
    const userUpdateQuery = {
      _id: new mongodb.ObjectID(req.body.userID),
    };
    encryptedPw = encryptPassword(req.body.password);
    const updates = {
      $set: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone_number,
        address: req.body.address,
        pw: encryptedPw,
        ngo: req.body.ngo ? req.body.ngo : false,
        create_time: new Date(),
      },
    };

    dbConnection
      .collection("Users")
      .updateOne(userUpdateQuery, updates, function (err, _result) {
        if (err) {
          console.error(JSON.stringify(err));
          res
            .status(400)
            .send(`Error updating user id ${userUpdateQuery._id}!`);
        } else {
          console.log("1 document updated");
          res.status(200).send("Success");
        }
      });
  };
app.put("/subscribe_events", (req, res) => {
  console.log(
    "Received new subscribe events request " + JSON.stringify(req.body.events)
  );
  var lng;
  var lat;
  var max_dist;
  if (req.body.event_receive_location) {
    max_dist = req.body.event_receive_location.max_distance;
    lng = req.body.event_receive_location.lng;
    lat = req.body.event_receive_location.lat;
  } else {
    lng = null;
    lat = null;
    max_dist = null;
  }
  const subscribeEventsQuery = {
    _id: new mongodb.ObjectID(req.body.user_id),
  };
  const updates = {
    $set: {
      subscribed_events: req.body.events,
      event_receive_location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      event_receive_max_distance: max_dist,
      last_modified_time: new Date().toLocaleString(),
    },
  };

  dbConnection
    .collection("Users")
    .updateOne(subscribeEventsQuery, updates, function (err, _result) {
      if (err) {
        console.error(JSON.stringify(err));
        res
          .status(400)
          .send(`Error updating user id ${subscribeEventsQuery._id}!`);
      } else {
        console.log("1 document updated");
        res.status(200).send("Success");
      }
    });
});
// This section will help you delete a record
app.delete("/users/delete", (req, res) => {
  console.log("Received delete request for cust id " + req.body.userID);
  const custQuery = {
    userID: req.body.userID,
  };

  dbConnection.collection("User").deleteOne(custQuery, function (err, _result) {
    if (err) {
      res.status(400).send(`Error deleting user with id ${custQuery.userID}!`);
    } else {
      console.log("1 document deleted");
      res.status(200).send();
    }
  });
});

//getDonations by email
app.get("/eventsbyemailandtype", (req, res) => {
  dbConnection
    .collection("Events")
    .find({
      email: {
        $eq: req.query.email,
      },
      event_type: req.query.type,
    })
    .limit(1000)
    .toArray(function (err, result) {
      if (err) {
        console.log(
          "eventsbyemailandtype - Failed to fetch events for " +
            req.query.email +
            ", error " +
            err
        );
        res.status(400).send("Error fetching donations!" + err);
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          res.status(200).jsonp(result);
          console.log(
            "eventsbyemailandtype - Success fetching events for " +
              req.query.email
          );
        } else {
          res.status(200).send([]);
          console.log("No donations for " + req.query.email);
        }
      }
    });
});
//Create Donation
app.post("/donations/insert", (req, res) => {
  var channel =
    "DONATE-" +
    req.body.city.toString().toUpperCase() +
    "-" +
    req.body.itemtype.toString().toUpperCase();
  const donationDocument = {
    email: req.body.email,
    postedby: req.body.postedby,
    time_created: Date().toString(),
    phone_number: req.body.phone_number,
    address: req.body.address,
    city: req.body.city.toString().trim().toUpperCase(),
    items: req.body.items,
    itemtype: req.body.itemtype.toString().trim().toUpperCase(),
    location: req.body.location,
    fa_icon: req.body.fa_icon,
    event_type: "DONATE",
  };
  createEvent(donationDocument, req, res);
});

//Donation Events
app.get("/donation-events", (req, res) => {
  dbConnection
    .collection("Events")
    .find({
      city: {
        $eq: req.query.city,
      },
      itemtype: {
        $eq: req.query.itemtype,
      },
    })
    .limit(1000)
    .toArray(function (err, result) {
      if (err) {
        console.log(
          "Failed to fetch donation events for " +
            req.query.city +
            req.query.itemtype +
            ", error " +
            err
        );
        res.status(400).send("Error fetching donations!" + err);
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          res.status(200).jsonp(result);
          console.log("Success fetching donations");
        } else {
          res.status(200).send([]);
          console.log(
            "No donations for " + req.query.city + req.query.itemtype
          );
        }
      }
    });
});

//Create Need
app.post("/needs/insert", (req, res) => {
  console.log("Need document = " + JSON.stringify(req.body));
  req.body.city.toString().toUpperCase();
  const needDocument = {
    email: req.body.email,
    postedby: req.body.postedby,
    time_created: Date().toLocaleString(),
    phone_number: req.body.phone_number,
    address: req.body.address,
    city: req.body.city,
    items: req.body.items,
    itemtype: req.body.itemtype,
    location: req.body.location,
    fa_icon: req.body.fa_icon,
    event_type: "NEED",
  };
  createEvent(needDocument, req, res);
});

app.get("/eventsbycityandtype", (req, res) => {
  dbConnection
    .collection("Events")
    .find({
      city: {
        $eq: req.query.city.trim().toUpperCase(),
      },
      event_type: req.query.type,
    })
    .limit(1000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed to fetch needs for eventsbycityandtype" + err);
        res.status(400).send("Error fetching needs!" + err);
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          res.status(200).jsonp(result);
          console.log("Success fetching needs for eventsbycityandtype");
        } else {
          res.send([]);
          console.log(
            "No records for " + req.query.city + " and type " + req.query.type
          );
        }
      }
    });
});

app.put("/needs/update", (req, res) => {
  const needUpdateQuery = {
    _id: new mongodb.ObjectID(req.body.needID),
  };
  console.log("Need update query body: " + JSON.stringify(req.body));
  const updates = {
    $set: {
      email: req.body.email,
      postedby: req.body.postedby,
      time_created: Date().toString(),
      phone_number: req.body.phone_number,
      address: req.body.address,
      city: req.body.city,
      items: req.body.items,
      itemtype: req.body.itemtype,
      location: req.body.location,
      fa_icon: req.body.fa_icon,
    },
  };

  dbConnection
    .collection("Events")
    .updateOne(needUpdateQuery, updates, function (err, _result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send(`Error updating user id ${needUpdateQuery._id}!`);
      } else {
        console.log("1 document updated");
        res.status(200).send("Success");
      }
    });
});
//Cancel Need
app.delete("/needs/delete", (req, res) => {
  console.log("Received delete request for need id " + req.body.needID);
  const query = {
    _id: new mongodb.ObjectID(req.body.needID),
  };

  dbConnection.collection("Events").deleteOne(query, function (err, _result) {
    if (err) {
      res.status(400).send(`Error deleting need with id ${req.body.needID}!`);
    } else {
      console.log("1 document deleted");
      res.status(200).send("Success");
    }
  });
});

//Create Event
//app.post("/events/insert", (req, res) => {
function createEvent(obj, req, res) {
  console.log("Event document = " + JSON.stringify(obj));
  var channel =
    obj.event_type +
    "-" +
    obj.itemtype.trim().toUpperCase() +
    "-" +
    obj.city.trim().toUpperCase();
  const eventDocument = {
    event_type: obj.event_type,
    event_name: channel,
    city: obj.city.trim().toUpperCase(),
    location: {
      type: "Point",
      coordinates: [obj.location.longitude, obj.location.latitude],
    },
    postedby: obj.postedby,
    phone_number: obj.phone_number,
    email: obj.email,
    address: obj.address,
    itemtype: obj.itemtype,
    items: obj.items,
    fa_icon: obj.fa_icon,
    time_created: new Date().toLocaleString(),
  };
  dbConnection
    .collection("Events")
    .insertOne(eventDocument, function (err, result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(401).send(err);
      } else {
        console.log(`Added a new event with id ${result.insertedId}`);
        console.log("Sending event to subscribers of channel " + channel);
        io.sockets.in(channel).emit("event", {
          event_id: result.insertedId,
          eventDetails: eventDocument,
        });
        res.status(201).send("Success");
      }
    });
  //dbConnection.collection("Events").createIndex({ location: "2dsphere" });
  const eventsCollection = dbConnection.collection("Events");
  const result = eventsCollection.createIndex({ location: "2dsphere" });
  console.log(`Index created: ${result}`);
}
//Get Events By Subscription
app.post("/fetchevents", (req, res) => {
  console.log("FetchEvents Call...");
  dbConnection
    .collection("Events")
    .find({
      event_name: {
        $in: req.body.subscribed_events,
      },
    })
    .limit(200)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed to fetch event  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events");
        if (result && result.length > 0) {
          res.status(200).jsonp(result);
        } else {
          res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});
//Nearby Events by event type ie NEED or DONATION
app.get("/fetchnearbyevents", (req, res) => {
  dbConnection
    .collection("Events")
    .find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(req.query.lng), Number(req.query.lat)],
          },
          $maxDistance: Number(req.query.max_distance),
        },
      },
      event_type: req.query.type,
    })
    .limit(20)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed to fetch event  " + err);
        res.status(404).send("No Events Found");
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          res.status(200).send(result);
          console.log("Success fetching nearby events ");
        } else {
          res.jsonp([]);
          console.log("No events");
        }
      }
    });
});
//Neaby Events for my subscribed geo location options
app.get("/fetchmynearbyevents", (req, res) => {
  dbConnection
    .collection("Events")
    .find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(req.query.lng), Number(req.query.lat)],
          },
          $maxDistance: Number(req.query.max_distance),
        },
      },
    })
    .limit(200)
    .toArray(function (err, result) {
      if (err) {
        console.log("fetchmynearbyevents: Failed to fetch event  " + err);
        res.status(400).send("Error fetching event!" + err);
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          res.status(200).send(result);
          console.log("fetchmynearbyevents: Success fetching nearby events ");
        } else {
          res.jsonp([]);
          console.log("ifetchmynearbyevents: No events");
        }
      }
    });
});
function sendEventToNearbySubscribedUsers(lng, lat, max_dist, event) {
  dbConnection
    .collection("Users")
    .find({
      event_receive_location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $event_receive_max_distance: Number(max_dist),
        },
      },
    })
    .limit(200)
    .toArray(function (err, result) {
      if (err) {
        console.log("fetchmynearbyevents: Failed to fetch event  " + err);
        res.status(400).send("Error fetching event!" + err);
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          res.status(200).send(result);
          console.log(
            "fetchmynearbyevents: Success fetching nearby users subscribed to location events. " +
              JSON.stringify(result)
          );
        } else {
          res.jsonp([]);
          console.log("ifetchmynearbyevents: No events");
        }
      }
    });
}
//Event Update
app.put("/events/update", (req, res) => {
  const eventUpdateQuery = {
    _id: new mongodb.ObjectID(req.body.eventID),
  };
  console.log("Event update query body: " + JSON.stringify(req.body));
  const updates = {
    $set: {
      event_type: req.body.event_type,
      event_name: req.body.event_name,
      city: req.body.city,
      item_category: req.body.item_category,
      item_name: req.body.item_name,
      time_created: Date().toString(),
    },
  };

  dbConnection
    .collection("Events")
    .updateOne(eventUpdateQuery, updates, function (err, _result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send(`Error updating user id ${eventUpdateQuery._id}!`);
      } else {
        console.log("1 document updated");
        res.status(200).send("Success");
      }
    });
});
//Cancel Event
app.delete("/events/delete", (req, res) => {
  console.log("Received delete request for event id " + req.body.eventID);
  const query = {
    _id: new mongodb.ObjectID(req.body.eventID),
  };

  dbConnection.collection("Events").deleteOne(query, function (err, _result) {
    if (err) {
      res.status(400).send(`Error deleting event with id ${req.body.eventID}!`);
    } else {
      console.log("1 document deleted");
      res.status(200).send("Success");
    }
  });
});

//Create Subscription
app.post("/subscriptions/insert", (req, res) => {
  console.log("Subscription document = " + JSON.stringify(req.body));
  const subscriptionDocument = {
    user_id: req.body.user_id,
    email: req.body.email,
    subscribed_events: req.body.events,
    time_created: Date().toString(),
  };
  dbConnection
    .collection("Subscriptions")
    .insertOne(subscriptionDocument, function (err, result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send("Error inserting subscriptionDocument data!");
      } else {
        console.log(`Added a new subscription with id ${result.insertedId}`);
        res.status(201).send("Success");
      }
    });
});
//Subscriptions Update
app.put("/subscriptions/update", (req, res) => {
  const subscriptionsUpdateQuery = {
    _id: new mongodb.ObjectID(req.body.subscriptionID),
  };
  const updates = {
    $set: {
      user_id: req.body.user_id,
      email: req.body.email,
      subscribed_events: req.body.subscribed_events,
      time_created: Date().toString(),
    },
  };

  dbConnection
    .collection("Subscriptions")
    .updateOne(subscriptionsUpdateQuery, updates, function (err, _result) {
      if (err) {
        console.error(JSON.stringify(err));
        res
          .status(400)
          .send(`Error updating user id ${subscriptionsUpdateQuery._id}!`);
      } else {
        console.log("1 document updated");
        res.status(200).send("Success");
      }
    });
});
//Cancel Event
app.delete("/subscriptions/delete", (req, res) => {
  console.log(
    "Received delete request for subscription id " + req.body.subscriptionID
  );
  const query = {
    _id: new mongodb.ObjectID(req.body.subscriptionID),
  };

  dbConnection
    .collection("Subscriptions")
    .deleteOne(query, function (err, _result) {
      if (err) {
        res
          .status(400)
          .send(
            `Error deleting subscription with id ${req.body.subscriptionID}!`
          );
      } else {
        console.log("1 document deleted");
        res.status(200).send("Success");
      }
    });
});
//module.exports = recordRoutes;
// Listen for requests until the server is stopped

//app.use(cors());
var whitelist = [
  "https://donation-web-vq2uax3u4q-el.a.run.app",
  "http://localhost:3000",
  "http://159.122.177.104:31363",
];
app.use(
  cors({
    origin: whitelist,
  })
);
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log("listening on *:" + PORT);
});
const io = require("socket.io")(httpServer, {
  cors: {
    //origin: "http://localhost:3000",
    origin: whitelist,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  allowEIO3: true,
});
var mysocket = null;
io.on("connection", function (socket) {
  mysocket = socket;
  console.log("a user connected");
  mysocket.emit("event", { lang: "en-US", text: "Today is a beautiful day" });
  socket.on("create-room", function (rooms) {
    if (rooms) {
      var channels = rooms.channels;
      if (channels && channels.length > 0) {
        for (i = 0; i < channels.length; i++) {
          socket.join(channels[i]);
          console.log("Joined client socket to room " + channels[i]);
        }
      }
    }
  });
  socket.on("send-login", function (userInfo) {
    console.log("#####User Info: " + JSON.stringify(userInfo));
    loggedinUsers.push(userInfo);
    mysocket.emit("loggedin-users", {
      currentUsers: loggedinUsers,
    });
  });
  socket.on("leave", function (room) {
    console.log("#####Disconecting client socket from room " + room);
    socket.leave(room);
  });
  socket.on("speech", function (speech) {
    //const target = "th";
    console.log(JSON.stringify(speech));
    translateText(speech.text, speech.target);
  });
});

/*
httpServer.listen(PORT, () => {
  console.log("listening on *:" + PORT);
});*/
