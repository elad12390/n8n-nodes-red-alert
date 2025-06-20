module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json'],
		sourceType: 'module',
	},
	extends: ['plugin:n8n-nodes-base/nodes'],
	rules: {
		'n8n-nodes-base/node-param-default-missing': 'error',
		'n8n-nodes-base/node-param-description-missing': 'error',
		'n8n-nodes-base/node-param-display-name-missing': 'error',
		'n8n-nodes-base/node-param-type-options-missing': 'error',
	},
}; 