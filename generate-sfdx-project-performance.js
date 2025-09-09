/**
 * @copyright 2024 Certinia Inc. All rights reserved.
 */

const filePath = process.argv[2];
const fs = require('fs'),
	projectJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
projectJson.packageDirectories.forEach((pkgDir) => {
	pkgDir.default = false;
});

projectJson.packageDirectories.push({
	path: 'force-app/test/performance',
	default: true
});

fs.writeFileSync(filePath, JSON.stringify(projectJson, null, '\t'));
