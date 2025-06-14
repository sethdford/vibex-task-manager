import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supportedModelsPath = path.join(
	__dirname,
	'..',
	'modules',
	'supported-models.json'
);
const outputMarkdownPath = path.join(
	__dirname,
	'..',
	'..',
	'docs',
	'models.md'
);

interface Model {
	provider: string;
	modelId: string;
	sweScore?: number | null;
	cost?: {
		input: number | null;
		output: number | null;
	} | null;
}

interface SupportedModels {
	models: Model[];
	lastUpdated: string;
}

function formatCost(cost: number | null | undefined): string {
	if (cost === null || cost === undefined) {
		return '—';
	}
	return cost.toString();
}

function formatSweScore(score: number | null | undefined): string {
	if (score === null || score === undefined || score === 0) {
		return '—';
	}
	return `${score}%`;
}

function generateMarkdown(data: SupportedModels): string {
	let markdown = '# Supported Models\n\n';
	markdown += `Last Updated: ${data.lastUpdated}\n\n`;
	markdown +=
		'| Provider | Model ID | SWE Score | Input Cost | Output Cost |\n';
	markdown += '|----------|----------|-----------|------------|-------------|\n';

	data.models.forEach((model) => {
		const sweScore = formatSweScore(model.sweScore);
		const inputCost = formatCost(model.cost?.input);
		const outputCost = formatCost(model.cost?.output);
		markdown += `| ${model.provider} | ${model.modelId} | ${sweScore} | ${inputCost} | ${outputCost} |\n`;
	});

	return markdown;
}

// Read the JSON file
try {
	const jsonData = fs.readFileSync(supportedModelsPath, 'utf-8');
	const data: SupportedModels = JSON.parse(jsonData);

	// Generate markdown
	const markdown = generateMarkdown(data);

	// Write the markdown file
	fs.writeFileSync(outputMarkdownPath, markdown);
	console.log('✅ Successfully generated models.md');
} catch (error) {
	console.error('❌ Error generating markdown:', error);
	process.exit(1);
}