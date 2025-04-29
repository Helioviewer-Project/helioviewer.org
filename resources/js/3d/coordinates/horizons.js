import { CoordinateList } from "./coordinate";
import { Coordinator } from "./coordinator";

/**
 * Interface to JPL Horizons (passes through our Coordinator server).
 */
class Horizons {
    /**
     * Creates an instance of Horizons suitable for making ephemeris queries.
     * @param {Coordinator} coordinator instance of coordinator interface
     */
    constructor(coordinator) {
        this.coordinator = coordinator
    }

    /**
     * Queries the location of the given observatory
     * @param {string} observatory
     * @param {Date} start
     * @param {Date} end
     * @returns {Promise<CoordinateList>}
     */
    GetLocations(observatory, start, end) {
        return this.coordinator.Position(observatory, start.toISOString(), end.toISOString());
    }
}

export { Horizons }
