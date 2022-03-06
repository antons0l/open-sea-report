import "dotenv/config";
import { CsvWriter } from "./csvWriter";
import { OpenSeaClient, OpenSeaEvent } from "./openSeaClient";
import dayjs from "dayjs";

async function main() {
  const openSeaClient = new OpenSeaClient();
  const csvWriter = new CsvWriter();
  const boredApeYachtClubAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

  const startDate = dayjs().subtract(28, 'days').toDate();

  console.log(getTimestamp() + ": Preparing report...");
  const events: OpenSeaEvent[] = await openSeaClient.getEvents(boredApeYachtClubAddress, startDate);
  events.sort(compare);
  console.log(getTimestamp() + ": Writing to file...");
  await csvWriter.writeOutput(events);
  console.log(getTimestamp() + ": Done!");
}

function getTimestamp() {
  const date = new Date();
  return `${date.toLocaleDateString("en-US")} ${date.toLocaleTimeString(
    "en-US"
  )}`;
}

function compare(e1: OpenSeaEvent, e2: OpenSeaEvent){
  if (e1.starting_price < e2.starting_price) return -1;
  if (e1.starting_price > e2.starting_price) return 1;
  return 0;
}

(async function () {
  try {
    await main();
  } catch (e) {
    console.log(e);
  }
})();
