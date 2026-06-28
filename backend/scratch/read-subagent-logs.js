const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\jashwanth\\.gemini\\antigravity-ide\\brain\\f76bc011-8d12-4bd5-ba2d-89ebeab6c541\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                // If it's a model response step containing the tool results
            }
        }
        if (obj.type === "CAPTURE_BROWSER_CONSOLE_LOGS" || obj.type === "BROWSER_CONSOLE_LOGS" || (obj.content && obj.content.includes("console logs"))) {
            // Find steps that contain console log outputs
        }
        // Let's print any JSON line that has the logs inside it
        if (line.includes("console") && line.includes("text")) {
            // console.log("MATCH:", line.substring(0, 500));
        }
    } catch (e) {
        // ignore
    }
});

// Let's just read the last lines of transcript and search for console logs output structure.
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
for (const line of lines) {
    if (line.includes('"toolName":"capture_browser_console_logs"') || line.includes('capture_browser_console_logs')) {
        try {
            const parsed = JSON.parse(line);
            console.log("Found console log step:", parsed.step_index);
            // Let's find the matching result step (usually the next step or a few steps later)
            const resultIndex = parsed.step_index + 1;
            const resultLine = lines.find(l => {
                try {
                    const p = JSON.parse(l);
                    return p.step_index === resultIndex || (p.content && p.content.includes("Console logs:"));
                } catch(e) { return false; }
            });
            if (resultLine) {
                console.log("Result:", JSON.parse(resultLine).content);
            }
        } catch(e) {}
    }
}
