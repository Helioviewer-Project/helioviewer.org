
export default class API {

  constructor(apiurl) {

    if (!apiurl.endsWith('/')) {
      apiurl += '/';
    }

    this.apiurl = apiurl;
  }

  async getEvents(date, source) {

	  const startTime = date.toISOString();

	  const url = `${this.apiurl}?startTime=${encodeURIComponent(startTime)}&action=events&sources=${encodeURIComponent(source)}`;

	  const response = await fetch(url, {
		mode: "cors"
	  });

	  if (!response.ok) {
		console.error(response);
	  }

	  const data = await response.json();

	  return data;
  }

}
