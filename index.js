// internal
const url = require('url');

// packages
const maxmind = require('maxmind');
const Raven = require('raven');

// local
const { processLookupMatch } = require('./utils');

// if the SENTRY_DSN environment variable is provided, hook up Sentry
if (process.env.SENTRY_DSN) {
  Raven.config(process.env.SENTRY_DSN).install();
}

// we only allow approved origins in, so this environment variable is required
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
if (!ALLOWED_ORIGIN)
  throw new Error('Please provide an ALLOWED_ORIGIN environmental variable');

// ready to test origins
const origin_re = new RegExp(ALLOWED_ORIGIN);

// setting up the lookup is slow, so do it first synchronously
const lookup = maxmind.openSync('./GeoLite2-City.mmdb');

module.exports = (req, res) => {
  // a hook to let deployment platforms know we're ready to go
  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return 'OK';
  }

  // now let's make sure the origin we're working with is valid before going
  // forward
  const origin = req.headers['origin'];

  // if there is no origin provided, or it fails the regex test, abort
  if (!origin || !origin_re.test(origin)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return 'Unauthorized';
  }

  // cache nothing, please: https://stackoverflow.com/a/2068407
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Vary', '*');

  // TODO: allow filtering of origins
  res.setHeader('Access-Control-Allow-Origin', origin);

  // the requesting service's IP
  let ip = req.connection.remoteAddress;

  // prep the querystring, if one exists
  const urlParts = url.parse(req.url, true);

  // if an IP was passed as a querystring, use that instead
  if (urlParts.query.ip) {
    ip = urlParts.query.ip;

    // or if an IP was passed along in the X-Forwarded-For header, use that
  } else if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(/,\s+/)[0];
  }

  // set up the payload
  const payload = {
    response: true,
  };

  // perform the lookup against the MaxMind DB
  const city = lookup.get(ip);

  if (city) {
    // if something returned, we're good to go
    payload.status = 'OK';
    payload.data = processLookupMatch(city);
    res.statusCode = 200;
  } else {
    // otherwise, no match was found
    payload.status = 'not found';
    res.statusCode = 404;
  }

  return payload;
};
