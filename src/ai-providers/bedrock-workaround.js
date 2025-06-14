import { generateText } from 'ai';
import { log } from '../../scripts/modules/index.js';
/**
 * Workaround for Bedrock's structured generation issues.
 * Uses text generation with JSON parsing instead of generateObject.
 */
export async function generateObjectWorkaround(client, params) {
    const { modelId, messages, schema, maxTokens, temperature } = params;
    // Convert Zod schema to a JSON schema description
    const schemaDescription = zodSchemaToDescription(schema);
    // Modify the last user message to include JSON instructions
    const modifiedMessages = [...messages];
    const lastMessage = modifiedMessages[modifiedMessages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
        lastMessage.content = `${lastMessage.content}

Please respond with a valid JSON object that matches this exact structure:
${schemaDescription}

IMPORTANT: Your response must be ONLY the JSON object, with no additional text before or after. Do not include markdown code blocks or any explanation.`;
    }
    try {
        // Use text generation
        const result = await generateText({
            model: client(modelId),
            messages: modifiedMessages,
            maxTokens,
            temperature
        });
        // Extract JSON from the response
        let jsonText = result.text.trim();
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        jsonText = jsonText.replace(/^```\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        // Parse the JSON
        let parsedObject;
        try {
            parsedObject = JSON.parse(jsonText);
        }
        catch (parseError) {
            // Try to extract JSON from the text
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedObject = JSON.parse(jsonMatch[0]);
            }
            else {
                throw new Error(`Failed to parse JSON from response: ${jsonText.substring(0, 200)}...`);
            }
        }
        // Validate against the schema
        const validationResult = schema.safeParse(parsedObject);
        if (!validationResult.success) {
            log('warn', 'Generated object failed schema validation:', validationResult.error);
            // Try to fix common issues
            parsedObject = attemptSchemaFix(parsedObject, schema, validationResult.error);
        }
        return {
            object: parsedObject,
            usage: result.usage
        };
    }
    catch (error) {
        log('error', 'Bedrock generateObject workaround failed:', error);
        throw error;
    }
}
/**
 * Convert Zod schema to a human-readable JSON structure description
 */
function zodSchemaToDescription(schema) {
    if (!schema._def)
        return 'Unknown schema';
    const def = schema._def;
    if (def.typeName === 'ZodObject') {
        const shape = def.shape();
        const obj = {};
        for (const [key, value] of Object.entries(shape)) {
            obj[key] = getFieldDescription(value);
        }
        return JSON.stringify(obj, null, 2);
    }
    return JSON.stringify({ type: 'unknown' }, null, 2);
}
function getFieldDescription(field) {
    if (!field._def)
        return 'any';
    const def = field._def;
    const description = def.description || '';
    switch (def.typeName) {
        case 'ZodString':
            return description || 'string';
        case 'ZodNumber':
            return description || 'number';
        case 'ZodBoolean':
            return description || 'boolean';
        case 'ZodArray':
            const innerType = getFieldDescription(def.type);
            return `array of ${innerType}` + (description ? ` - ${description}` : '');
        case 'ZodEnum':
            const values = def.values.join(' | ');
            return `one of: ${values}` + (description ? ` - ${description}` : '');
        case 'ZodOptional':
            return `(optional) ${getFieldDescription(def.innerType)}`;
        default:
            return description || def.typeName || 'any';
    }
}
/**
 * Attempt to fix common schema validation issues
 */
function attemptSchemaFix(obj, schema, error) {
    // For now, just return the object as-is
    // In a production system, we could implement more sophisticated fixes
    return obj;
}
