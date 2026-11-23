import type { Document } from "mongodb";
import { collection, type Db } from "../config/db.js";
import type { DeliveryLocation } from "./types.js";

type LocationDoc = Document & DeliveryLocation;
const locations = () => collection<LocationDoc>("delivery_locations");
const toLocation = (l: LocationDoc): DeliveryLocation => ({
  id: l.id, name: l.name, address: l.address, description: l.description, fee: l.fee, eta: l.eta, active: l.active,
});
export const LocationModel = {
  async list(onlyActive = false): Promise<DeliveryLocation[]> {
    return (await locations().find(onlyActive ? { active: true } : {}).sort({ fee: 1, name: 1 }).toArray()).map(toLocation);
  },
  async findById(id: string, db?: Db): Promise<DeliveryLocation | null> {
    const location = await locations().findOne({ id }, db ? { session: db } : {});
    return location ? toLocation(location) : null;
  },
  async create(l: DeliveryLocation): Promise<DeliveryLocation> {
    await locations().insertOne(l as LocationDoc);
    return l;
  },
  async update(id: string, l: Omit<DeliveryLocation, "id">): Promise<DeliveryLocation | null> {
    const location = await locations().findOneAndUpdate({ id }, { $set: l }, { returnDocument: "after" });
    return location ? toLocation(location) : null;
  },
  async delete(id: string): Promise<boolean> {
    const result = await locations().deleteOne({ id });
    return result.deletedCount > 0;
  },
};
