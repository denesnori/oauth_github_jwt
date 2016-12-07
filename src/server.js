const Hapi = require('hapi');
const server = new Hapi.Server();
const Inert = require('inert');
const Querystring = require('query-string');
const env = require('env2')('./config.env')
const Request = require('request');
const jwt = require('json-web-token');




server.connection({
  port: process.env.PORT || 5000
});

server.register([Inert], (err) => {
  if (err) throw err;
  server.route([
    {
      method:'GET',
      path: '/',
      handler: (request,reply) => {
        console.log('haho');
    //    reply('HAHO')
        reply.file('./index.html');
      }
    },
    {
      method: 'GET',
      path: '/login',
      handler: (request,reply) => {
        let query = {
          client_id: process.env.CLIENT_ID,
          redirect_uri: process.env.BASE_URL + '/home'
        };
        reply.redirect('https://github.com/login/oauth/authorize/?'+Querystring.stringify(query));
      }
    },
    {
      method:'GET',
      path: '/home',
      handler: (request,reply) => {
        let query={
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code: request.url.query.code
        };
        Request.post({url:'https://github.com/login/oauth/access_token', form: query},(err,res,body) => {
          if (err) throw err;
          let token = Querystring.parse(body);
          let  header = {
                'User-Agent': 'oauth_github_jwt',
                Authorization: `token ${token.access_token}`
              };
          let  url = `https://api.github.com/user`;
          Request.get({url:url, headers:header}, function (error, response, body) {
                 //reply(JSON.parse(body));
                 console.log(JSON.parse(body));
                 const secret = process.env.CLIENT_SECRET;

                 const payload = {
                   'typ': 'JWT',
                   'sub': 'github-data',
                   'exp': Date.now() + 24 * 60 * 60 * 1000,
                   'iat': Date.now(),
                    // we can add more stuff to payload
                   'accessToken': token.access_token///get it from swhere
                 };

                 const algorithm = 'HS256';
                 console.log(token.access_token);
                 jwt.encode(secret, payload, algorithm, function (err, token) {
                   if (err) {
                     return console.error(err.name, err.message);
                   } else {
                     console.log('encoded',token);
                     // decode
                     jwt.decode(secret, token, function (err_, decode) {
                       if (err) {
                         return console.error(err.name, err.message);
                       } else {
                         console.log('decoded',decode);
                       }
                     });
                   }
                 });
          });
        });
      }
    },
  ]);
});

module.exports = server;
