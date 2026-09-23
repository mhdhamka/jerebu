/**
 * JerebuAQI Unified Domain Types and Data Contracts
 */

/**
 * @typedef {Object} UserReport
 * @property {string} id
 * @property {string} area_name
 * @property {string} [city]
 * @property {number} lat
 * @property {number} lng
 * @property {number} visibility_meters
 * @property {string} smell_level
 * @property {number} smell_score
 * @property {number} estimated_aqi
 * @property {number} trust_weight
 * @property {number} panic_score
 * @property {string[]} symptoms
 * @property {string} description
 * @property {number} upvotes
 * @property {string} created_at
 */

/**
 * @typedef {Object} OfficialStation
 * @property {string} id
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {number} aqi
 * @property {string} status
 * @property {string} state
 * @property {string} country
 * @property {string} last_updated
 */

/**
 * @typedef {Object} AnomalyCluster
 * @property {number} cluster_id
 * @property {{lat: number, lng: number}} centroid
 * @property {number} report_count
 * @property {number} ground_truth_aqi
 * @property {{name: string, official_aqi: number, distance_km: number}|null} nearest_station
 * @property {number} discrepancy
 * @property {boolean} is_anomaly
 * @property {number} confidence_score
 */
export {};
