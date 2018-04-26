import mongodb from 'mongodb';

export default {

  connectToMongo() {
    return new Promise( (resolve, reject) => {
      let MongoClient = mongodb.MongoClient;
      let url = "mongodb://localhost:27017/";

      MongoClient.connect(url, (err, client) => {
        if (err) reject(err);
        resolve(client);
      });
    });
  },

  addGroup(collection, group) {
    return collection.findOne(group)
    .then(
      function success(result) {
        if (result != null) return result;

        return collection.insertOne(group).then( (res) => {
          return res.ops[0];
        } );
      },
      function error(err) {
        throw err;
      }
    )
  },

  addPhoto(collection, photoData) {
    // Add to AWS -> .then()
    return collection.findOne(photoData)
    .then(
      function success(photo) {
        if (photo != null) return photo; // Picture is already in db

        return collection.insertOne(photoData).then( (res) => {return res.ops[0]} );
      },
      function error(err) {
        throw err;
      }
    )

  }

}
