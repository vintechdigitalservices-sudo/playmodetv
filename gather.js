const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to your warehouse
const dataFolder = path.join(__dirname, 'data');

console.log("--- PlayMode Africa: Content Supplier Tool ---");

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function startGathering() {
  console.log("\nAvailable Categories: politics, finance, business, tech, health, weather, discovery");
  
  const category = await askQuestion("Which category are we stocking? ");
  const filePath = path.join(dataFolder, `${category.toLowerCase()}.json`);

  // 1. Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.log(`Error: ${category}.json not found in /data folder.`);
    rl.close();
    return;
  }

  // 2. Capture Video Details
  const videoId = await askQuestion("Paste the YouTube Video ID (e.g., dQw4w9WgXcQ): ");
  const title = await askQuestion("Enter Video Title: ");
  const source = await askQuestion("Enter Source Name (e.g., Arise News): ");

  // 3. Read existing data
  const rawData = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawData);

  // 4. Create the new entry
  const newEntry = {
    id: videoId,
    title: title,
    source: source,
    dateAdded: new Date().toISOString().split('T')[0] // Tracks when you added it
  };

  // 5. Add to the random_bank
  jsonData.random_bank.push(newEntry);

  // 6. Write back to the file
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

  console.log(`\n✅ Success! "${title}" added to ${category}.json`);
  
  const cont = await askQuestion("Add another? (y/n): ");
  if (cont.toLowerCase() === 'y') {
    startGathering();
  } else {
    console.log("Warehouse updated. Ready for Git Push!");
    rl.close();
  }
}

startGathering();
