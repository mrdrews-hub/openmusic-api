require('dotenv').config();

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

const Hapi = require("@hapi/hapi");

// Album
const albums = require('./src/api/album');
const AlbumsService = require('./src/services/postgres/AlbumService');
const AlbumsValidator = require('./src/validator/album');

// Song
const songs = require('./src/api/song');
const SongsService = require('./src/services/postgres/SongService');
const SongsValidator = require('./src/validator/song');

const ClientError = require('./src/exceptions/ClientError');

const init = async () => {
  try {
    const albumsService = new AlbumsService();
    const songsService = new SongsService();
  
    const server = Hapi.server({
      port: PORT,
      host: HOST,
      routes: {
        cors: {
          origin: ['*'],
        },
      },
    });
  
    await server.register([
      {
        plugin: albums,
        options: {
          service: albumsService,
          validator: AlbumsValidator,
        }
      },
      {
        plugin: songs,
        options: {
          service: songsService,
          validator: SongsValidator,
        },
      },
    ])
  
    server.ext('onPreResponse', (request, h) => {
      const { response } = request;
      if (response instanceof Error) {
        if (response instanceof ClientError) {
          const newResponse = h.response({
            status: 'fail',
            message: response.message,
          }).code(response.statusCode)
          return newResponse;
        }
        if (!response.isServer) {
          return h.continue;
        }
        const newResponse = h.response({
          status: 'error',
          message: 'Internal server error',
        }).code(500);
        return newResponse;
      }
      return h.continue;
    });
  
    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
  } catch (error) {
    console.log(error);
  }
};

init();