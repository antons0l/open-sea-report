import { createObjectCsvWriter } from "csv-writer";
import { OpenSeaEvent } from "./openSeaClient";

export class CsvWriter {
  public async writeOutput(events: OpenSeaEvent[]) {
    const csvWriter = createObjectCsvWriter ({
      path: "report.csv",
      header: [
        { id: "starting_price", title: "listing price" },
        { id: "token_id", title: "tokenId" },
        { id: "listing_time", title: "listing date" },
      ],
    });

    await csvWriter.writeRecords(events)
  }
}
