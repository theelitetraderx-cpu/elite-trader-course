const fs = require("fs");
const path = require("path");

function extractText(html) {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
  return text;
}

const files = ["site-home.html", "site-community.html", "site-signals.html"];

for (const file of files) {
  const fp = path.join(__dirname, file);
  if (!fs.existsSync(fp)) continue;
  console.log("\n========== " + file + " ==========\n");
  const html = fs.readFileSync(fp, "utf8");
  const text = extractText(html);
  // Split on common section markers and print chunks
  const chunks = text.split(/(?=[A-Z][a-z])/);
  const lines = text.match(/[^.!?]+[.!?]+/g) || [text];
  const seen = new Set();
  for (const line of lines) {
    const t = line.trim();
    if (t.length < 15 || t.length > 500 || seen.has(t)) continue;
    if (
      /course|trade|elite|plan|price|module|lesson|mentor|signal|community|forex|crypto|future|discipline|smart|wise|premium|enrol|contact|support|futures|precision|navigate|market|strategy|risk|mindset|skill|journey|membership|subscription|monthly|annual|₹|INR|discord|live class|analysis/i.test(
        t
      )
    ) {
      seen.add(t);
      console.log(t);
    }
  }
}
