require('dotenv').config();

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

const Hapi = require("@hapi/hapi");

// Album
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

// Song
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
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
			plugins: albums,
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
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      if (!response.isServer) {
        return h.continue;
      }
      const newResponse = h.response({
        status: 'error',
        message: 'Internal server error',
      });
      newResponse.code(500);
      return newResponse;
    }
    return h.continue;
  });

	await server.start();
	console.log(`Server berjalan pada ${server.info.uri}`);
};

init();