const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'data', 'pux_data.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    const initialData = {
      pux_members: [],
      backup_pux: [],
      po_feedback: [],
      steps_definition: {
        step1: {
          name: "第一步",
          description: "直接和研发对齐任务"
        },
        step2: {
          name: "第二步",
          description: "自己产生想法并推进"
        },
        step3: {
          name: "第三步",
          description: "从想法到 demo 甚至到推广运营"
        }
      }
    };
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(initialData, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  ensureDataFile,
  readData,
  writeData,
  DATA_PATH
};
