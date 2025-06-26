export default async function globalSetup() {
	// Set environment variables for tests
	process.env.NODE_ENV = 'test';

	// You can add more global setup here
	console.log('\n🧪 Running global test setup...\n');
}
