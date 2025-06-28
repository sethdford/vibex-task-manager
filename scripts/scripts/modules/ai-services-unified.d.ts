/**
 * ai-services-unified.js
 * Centralized AI service layer using provider modules and config-manager.
 */
export interface AIServiceResponse {
    mainResult: string | null;
    telemetryData: Record<string, any> | null;
}
/**
 * Generates text using the configured AI services, with fallback logic.
 *
 * @param {object} params - The parameters for the text generation.
 * @param {'main'|'research'} params.role - The primary role to use ('main' or 'research').
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.systemPrompt] - An optional system prompt.
 * @param {object} [params.session=null] - Optional MCP session object.
 * @param {string} [params.projectRoot=null] - Optional project root path.
 * @param {string} params.commandName - Name of the command for telemetry.
 * @param {'cli'|'mcp'} params.outputType - Output type for telemetry.
 * @returns {Promise<AIServiceResponse|null>} An object containing the main result and telemetry data, or null if all services fail.
 */
export declare function generateTextService(params: any): Promise<AIServiceResponse | null>;
/**
 * Streams text using the configured AI services, with fallback logic.
 * Note: Streaming results are handled by the provider and not returned directly here.
 *
 * @param {object} params - The parameters for the text streaming.
 * @param {'main'|'research'} params.role - The primary role to use.
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.systemPrompt] - An optional system prompt.
 * @param {object} [params.session=null] - Optional MCP session object.
 * @param {string} [params.projectRoot=null] - Optional project root path.
 * @param {string} params.commandName - Name of the command for telemetry.
 * @param {'cli'|'mcp'} params.outputType - Output type for telemetry.
 * @returns {Promise<AIServiceResponse|null>} An object containing telemetry data, or null if all services fail. The mainResult will be null for streams.
 */
export declare function streamTextService(params: any): Promise<AIServiceResponse | null>;
/**
 * Generates a structured object using the configured AI services, with fallback logic.
 *
 * @param {object} params - The parameters for the object generation.
 * @param {'main'|'research'} params.role - The primary role to use.
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.systemPrompt] - An optional system prompt.
 * @param {z.ZodSchema<T>} params.schema - The Zod schema for the expected object.
 * @param {string} params.objectName - A name for the object/tool being generated.
 * @param {object} [params.session=null] - Optional MCP session object.
 * @param {string} [params.projectRoot=null] - Optional project root path.
 * @param {string} params.commandName - Name of the command for telemetry.
 * @param {'cli'|'mcp'} params.outputType - Output type for telemetry.
 * @returns {Promise<AIServiceResponse|null>} An object containing the generated object in mainResult and telemetry data, or null if all services fail.
 */
export declare function generateObjectService(params: any): Promise<AIServiceResponse | null>;
//# sourceMappingURL=ai-services-unified.d.ts.map