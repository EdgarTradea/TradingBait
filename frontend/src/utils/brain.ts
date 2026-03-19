import apiclient from "@/apiclient";

/**
 * Compatibility shim for 'brain' module.
 * This redirects legacy 'brain' calls to the new 'apiClient'.
 */
const brain = apiclient;

export default brain;
