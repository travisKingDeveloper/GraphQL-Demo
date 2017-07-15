// @flow
import mongoose from 'mongoose';
import * as loaders from '../src/loader';

const { ObjectId } = mongoose.Types;

process.env.NODE_ENV = 'test';

const config = {
  db: {
    test: 'mongodb://localhost/test',
  },
  connection: null,
};

function connect() {
  return new Promise((resolve, reject) => {
    if (config.connection) {
      return resolve();
    }

    const mongoUri = 'mongodb://localhost/test';

    mongoose.Promise = Promise;

    const options = {
      server: {
        auto_reconnect: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 1000,
      },
    };

    mongoose.connect(mongoUri, options);

    config.connection = mongoose.connection;

    config.connection
      .once('open', resolve)
      .on('error', (e) => {
        if (e.message.code === 'ETIMEDOUT') {
          console.log(e);

          mongoose.connect(mongoUri, options);
        }

        console.log(e);
        reject(e);
      });
  });
}

function clearDatabase() {
  return new Promise(resolve => {
    let cont = 0;
    let max = Object.keys(mongoose.connection.collections).length;
    for (const i in mongoose.connection.collections) {
      mongoose.connection.collections[i].remove(function() {
        cont++;
        if(cont >= max) {
          resolve();
        }
      });
    }
  });
}

export function getContext(context: Object) {
  const dataloaders = Object.keys(loaders).reduce((dataloaders, loaderKey) => ({
    ...dataloaders,
    [loaderKey]: loaders[loaderKey].getLoader(),
  }), {});

  return {
    ...context,
    req: {},
    dataloaders,
  };
}

export async function setupTest() {
  await connect();
  await clearDatabase();
}
