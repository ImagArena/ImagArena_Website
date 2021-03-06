import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import AWS from 'aws-sdk';
import mongodb from 'mongodb';
import ops from './db_operations';

const app = express();

app.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));

let logger = function(req, res, next) {
    let now = new Date();
    console.log(`${now}: ${req.url} from ip ${req.connection.remoteAddress}`);
    next(); // Passing the request to the next handler in the stack.
}
app.use(logger);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control");
    next();
});

let SERVERUSER =  process.argv[2];
let SERVERPWD = process.argv[3];

function saveGroup(req, res) {
    let groupData = req.body;
    ops.connectToMongo(groupData.auth).then(
      (client) => {
        let db = client.db('imagarena_groups');

        delete groupData.auth;
        ops.addGroup(db.collection('groups'), groupData)
        .then( (result) => {
          console.log("Saved", groupData.groupName);
          res.send(result);
        })
      },
      (err) => {
        res.status(500);
        res.send(err);
	console.log(err);
      }
    );
}

function savePhoto(req, res) {
  let photoData = req.body;

  let bucketUrl = "https://s3.amazonaws.com/imagarenagroupphotos/";
  if (!photoData.url.startsWith(bucketUrl)) {
    console.error("Invalid Photo: ", "\n", photoData);
    res.status(400).send("Photo is not from the ImagArena Bucket");
  }

  ops.connectToMongo(photoData.auth).then(
    (client) => {
      let db = client.db('imagarena_groups');

      delete photoData.auth;
      ops.addPhoto(db.collection('photos'), photoData).then(
        (result) => { res.send(result) },
        (err) => {
          res.status(500).send(err);
        }
      );
    },
    (err) => {
      res.status(500).send(err);
    }
  );
}

function getPhotosForGroup(req, res) {
  ops.connectToMongo({user: SERVERUSER, pwd: SERVERPWD}).then(
    (client) => {
      let db = client.db('imagarena_groups');
      let groupName = req.body.groupName;

      ops.getPhotos(db.collection('photos'), groupName)
      .then(
        (result) => { res.send({photos: result}); },
        (err) => {
          res.status(500).send(err);
        }
      );
    },
    (err) => {
      res.status(500).send(err);
    }
  );
}

function getGroupNames(req, res) {
  ops.connectToMongo({user: SERVERUSER, pwd: SERVERPWD}).then(
    (client) => {
      let db = client.db('imagarena_groups');
      ops.getGroupNames(db.collection('groups'), req.body)
      .then(
        (result) => { res.send({groups: result}) },
        (err) => {
          res.status(500).send(err);
        }
      );
    },
    (err) => {
      res.status(500).send(err);
    }
  );
}

function getRandomGroupName(req, res) {
  ops.connectToMongo({user: SERVERUSER, pwd: SERVERPWD}).then(
    (client) => {
      let db = client.db('imagarena_groups');
      ops.getRandomGroupName(db.collection('groups'))
      .then(
        (result) => {
          res.send({groupName: result.groupName})
        },
        (err) => {
          res.status(500).send(err);
        }
      );
    },
    (err) => {
      res.status(500).send(err);
    }
  );
}

function getRandomPhoto(req, res) {
  ops.connectToMongo({user: SERVERUSER, pwd: SERVERPWD}).then(
    (client) => {
      let db = client.db('imagarena_groups');
      ops.getRandomPhoto(db.collection('photos'))
      .then(
        (result) => {
          res.send({url: result.url});
        },
        (err) => {
          res.status(500).send(err);
        }
      );
    },
    (err) => {
      res.status(500).send(err);
    }
  );
}


app.get('/get_random_group', (req, res) => getRandomGroupName(req, res) );
app.get('/get_random_photo', (req, res) => getRandomPhoto(req, res) );

app.post('/save_group', (req, res) => saveGroup(req, res) );
app.post('/save_photo', (req, res) => savePhoto(req, res) );
app.post('/get_class_photos', (req, res) => getPhotosForGroup(req, res) );
app.post('/get_groupnames',   (req, res) => getGroupNames(req, res) );

let server = app.listen(3001,  () => {
    let host = server.address().address;
    let port = server.address().port;

    console.log('node listening at http://%s:%s', host, port);
});
