function processLookupMatch(result) {
  const o = {};

  // if for some reason it's empty, just stop here
  if (!result) return o;

  if ('city' in result) {
    o.city = result.city.names.en;
  }

  if ('postal' in result) {
    o.postal_code = result.postal.code;
  }

  if ('country' in result) {
    const country = result.country;

    o.country_iso_code = country.iso_code;
    o.country_name = country.names.en;
  }

  if ('location' in result) {
    const location = result.location;

    o.time_zone = location.time_zone;
    o.latitude = location.latitude;
    o.longitude = location.longitude;
    o.metro_code = location.metro_code;
  }

  if ('subdivisions' in result) {
    const subdivision = result.subdivisions[0];

    o.region_iso_code = subdivision.iso_code;
    o.region_name = subdivision.names.en;
  }

  return o;
}

module.exports = { processLookupMatch };
