/**
 * Get the current model configuration
 * @param options - Options for the operation
 * @returns RESTful response with current model configuration
 */
export function getModelConfiguration(options?: {}): Promise<{
    success: boolean;
    data: {
        activeModels: {
            main: {
                provider: string;
                modelId: string;
                sweScore: any;
                cost: any;
                keyStatus: {
                    cli: boolean;
                    mcp: {
                        isSet: boolean;
                        source: string | null;
                        value: string | null;
                    };
                };
            };
            research: {
                provider: string;
                modelId: string;
                sweScore: any;
                cost: any;
                keyStatus: {
                    cli: boolean;
                    mcp: {
                        isSet: boolean;
                        source: string | null;
                        value: string | null;
                    };
                };
            };
            fallback: {
                provider: string;
                modelId: string;
                sweScore: any;
                cost: any;
                keyStatus: {
                    cli: boolean;
                    mcp: boolean | {
                        isSet: boolean;
                        source: string | null;
                        value: string | null;
                    };
                };
            };
        };
        message: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: {
        code: string;
        message: any;
    };
    data?: undefined;
}>;
/**
 * Get all available models not currently in use
 * @param options - Options for the operation
 * @returns RESTful response with available models
 */
export function getAvailableModelsList(options?: {}): Promise<{
    success: boolean;
    data: {
        models: any;
        message: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: {
        code: string;
        message: any;
    };
    data?: undefined;
}>;
/**
 * Update a specific model in the configuration
 * @param role - The model role to update ('main', 'research', 'fallback')
 * @param modelId - The model ID to set for the role
 * @param options - Options for the operation
 * @returns RESTful response with result of update operation
 */
export function setModel(role: any, modelId: any, options?: {}): Promise<{
    success: boolean;
    data: {
        role: any;
        provider: any;
        modelId: string;
        message: string;
        warning: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: {
        code: string;
        message: any;
    };
    data?: undefined;
}>;
/**
 * Get API key status for all known providers.
 * @param options - Options for the operation
 * @returns RESTful response with API key status report
 */
export function getApiKeyStatusReport(options?: {}): Promise<{
    success: boolean;
    data: {
        report: {
            provider: string;
            cli: boolean;
            mcp: {
                isSet: boolean;
                source: string | null;
                value: string | null;
            };
        }[];
        message: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: {
        code: string;
        message: any;
    };
    data?: undefined;
}>;
//# sourceMappingURL=models.d.ts.map