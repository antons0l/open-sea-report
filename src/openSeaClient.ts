import axios from "axios";

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || "";

interface PaginatedResponse {
  events: Array<OpenSeaEvent>,
  cursor: string | null,
}

export interface OpenSeaEvent {
  token_id: string,
  permalink: string,
  image_url: string,
  created_date: string,
  listing_time: string,
  duration: string,
  auction_type: string,
  event_type: string,
  starting_price: number,
  ending_price: number,
}

export class OpenSeaClient {
  private apiUrl = "https://api.opensea.io/api/v1/events";
  private params = "only_opensea=true";
  private config = {
    headers: {
      Accept: "application/json",
      "X-API-KEY": OPENSEA_API_KEY,
    },
  };

  public async getEvents(contractAddress: string, startDate: Date) {
    let fetchNextPage = true;
    let currentCursor = null;
    let pageCount = 0;
    const listingMap = new Map<string, OpenSeaEvent>();
    while (fetchNextPage) {
      pageCount += 1;
      console.log(`Fetching page ${pageCount}`)
      const res: PaginatedResponse = await this.fetchPaginatedEvents(contractAddress, currentCursor);
      currentCursor = res.cursor;
      const outOfRange = res.events.find(event => new Date(event.created_date) < startDate);
      const filteredEvents = res.events.filter(event => {
        return new Date(event.created_date) > startDate && event.auction_type === "dutch"
      });
      filteredEvents.forEach(event => {
        if (!listingMap.has(event.token_id)) {
          listingMap.set(event.token_id, event);
        } else {
          const existingEvent = listingMap.get(event.token_id);
          if (existingEvent && Number.parseInt(event.duration) < Number.parseInt(existingEvent.duration)) {
            listingMap.set(event.token_id, event)
          } else {
            if (existingEvent && event.ending_price < existingEvent.ending_price) {
              listingMap.set(event.token_id, event)
            }
          }
        }
      })
      if (outOfRange || !currentCursor) fetchNextPage = false;
    }
    return Array.from(listingMap.values());;
  }

  private async fetchPaginatedEvents(contractAddress: string, cursor: string | null): Promise<PaginatedResponse> {
    let connectionString = `${this.apiUrl}?${this.params}&asset_contract_address=${contractAddress}`;
    if (cursor) connectionString = `${connectionString}&cursor=${cursor}`;
    const response: PaginatedResponse = {
      events: [],  
      cursor: null,
    };

    try {
      const axiosResponse = await axios.get(connectionString, this.config);
      if (axiosResponse.status !== 200) {
        console.log("Error fetching data from OpenSea API");
        return response;
      }
      const arr: OpenSeaEvent[] = [];
      axiosResponse.data.asset_events.forEach((ev: any) => {
        arr.push({
          token_id: ev.asset.token_id,
          permalink: ev.asset.permalink,
          image_url: ev.asset.image_url,
          created_date: ev.created_date,
          listing_time: ev.listing_time,
          duration: ev.duration,
          auction_type: ev.auction_type,
          event_type: ev.event_type,
          starting_price: Number.parseInt(ev.starting_price) / 1e18,
          ending_price: Number.parseInt(ev.ending_price) / 1e18,
        })
      });
      response.events = arr;
      response.cursor = axiosResponse.data.next;

    }
    catch(err) {
      console.log("Error fetching data from OpenSea API: " + err);
      return response;
    }

    return response;
  }
}
