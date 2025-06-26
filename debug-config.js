const {
	getMainModelId,
	getMainProvider
} = require('vibex-task-manager/scripts/modules/config-manager.js');

console.log('Testing config manager...');
console.log('Project root:', process.cwd());

try {
	const modelId = getMainModelId(process.cwd());
	const provider = getMainProvider(process.cwd());

	console.log('Main model ID:', modelId);
	console.log('Main provider:', provider);
} catch (error) {
	console.error('Error:', error.message);
}
