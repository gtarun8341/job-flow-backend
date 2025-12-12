import JobEmail from "../models/JobEmail.js";
import EmailSettings from "../models/EmailSettings.js";
import Imap from "imap";
import { simpleParser } from "mailparser";
import { decrypt } from "../utils/aesEncryption.js";

export const getJobEmailStats = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(
      "\n===== Fetching Job Email Stats for User:",
      userId,
      "=====\n"
    );

    const logs = await JobEmail.find({ userId });

    console.log("Total JobEmail Logs Found:", logs.length);

    const grouped = {};

    logs.forEach((log) => {
      const email = log.recruiterEmail.toLowerCase();

      if (!grouped[email]) {
        grouped[email] = {
          email,
          sentCount: 0,
          failedCount: 0,
          receivedCount: 0,
          lastReply: null,
        };
      }

      if (log.status === "sent") grouped[email].sentCount++;
      else grouped[email].failedCount++;
    });

    console.log("Grouped Sent/Failed Counts:", grouped);

    // build recruiter email list WITHOUT DUPLICATES
    const recruiterEmails = [...new Set(logs.map((log) => log.recruiterEmail))];

    console.log("Unique Recruiter Emails for IMAP:", recruiterEmails);
    console.log("Recruiter Emails for IMAP:", recruiterEmails);

    console.log("\n===== Checking IMAP Replies =====");

    // 🔥 FIX: pass recruiterEmails here
    const replies = await fetchRepliesFromIMAP(userId, recruiterEmails);

    console.log("Total Replies Fetched:", replies.length);
    // 🔥 FIX: Stable sorting even when parsed.date is null
    replies.sort((a, b) => {
      if (!a.date) return 1; // a = older
      if (!b.date) return -1; // b = older
      return new Date(b.date) - new Date(a.date);
    });

    // Debug: See final sorted order
    console.log(
      "🔍 SORT DEBUG:",
      replies.map((r) => ({
        from: r.from,
        date: r.date,
        body: r.body.slice(0, 50),
      }))
    );

    replies.forEach((r, index) => {
      const from = r.from.toLowerCase();
      const domain = from.split("@")[1];

      if (grouped[from]) {
        grouped[from].receivedCount++;

        // only set lastReply ONCE — on the first (newest) reply
        if (index === 0) {
          grouped[from].lastReply = r.body.slice(0, 200);
        }
      } else {
        Object.keys(grouped).forEach((sentEmail) => {
          if (sentEmail.endsWith(domain)) {
            grouped[sentEmail].receivedCount++;

            if (index === 0) {
              grouped[sentEmail].lastReply = r.body.slice(0, 200);
            }
          }
        });
      }
    });

    res.json({ success: true, stats: Object.values(grouped) });
  } catch (err) {
    console.error("❌ ERROR in getJobEmailStats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getJobEmailStatsService = async (userId) => {
  const logs = await JobEmail.find({ userId });

  const grouped = {};

  logs.forEach((log) => {
    const email = log.recruiterEmail.toLowerCase();

    if (!grouped[email]) {
      grouped[email] = {
        email,
        sentCount: 0,
        failedCount: 0,
        receivedCount: 0,
        lastReply: null,
      };
    }

    if (log.status === "sent") grouped[email].sentCount++;
    else grouped[email].failedCount++;
  });

  const recruiterEmails = [...new Set(logs.map((l) => l.recruiterEmail))];

  const replies = await fetchRepliesFromIMAP(userId, recruiterEmails);

  replies.forEach((reply) => {
    const from = reply.from.toLowerCase();

    if (!grouped[from]) return;

    grouped[from].receivedCount++;
    if (!grouped[from].lastReply)
      grouped[from].lastReply = reply.body.slice(0, 200);
  });

  return grouped;
};

function extractEmailFromBody(text) {
  if (!text) return null;
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function buildIMAPSearchFilter(emails) {
  if (emails.length === 1) {
    return [["FROM", emails[0]]];
  }

  let filter = ["FROM", emails.pop()];

  while (emails.length > 0) {
    const email = emails.pop();
    filter = ["OR", ["FROM", email], filter];
  }

  return [filter]; // ← IMPORTANT: wrap in array
}

const fetchRepliesFromIMAP = async (userId, recruiterEmails) => {
  const settings = await EmailSettings.findOne({ userId });
  if (!settings || recruiterEmails.length === 0) return [];

  console.log("\n===== START IMAP FETCH =====");

  return new Promise((resolve) => {
    const imap = new Imap({
      user: settings.smtpUsername,
      password: decrypt(settings.imapPassword),
      host: settings.imapHost,
      port: settings.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const results = [];
    const parsePromises = [];

    recruiterEmails = [...new Set(recruiterEmails)];
    // const recruiter = recruiterEmails[0].toLowerCase();
    // const userEmail = settings.smtpUsername.toLowerCase();

    // const searchFilter = [
    //   ["OR", ["HEADER", "From", recruiter], ["HEADER", "To", recruiter]],
    // ];

    let searchFilter = buildIMAPSearchFilter([...recruiterEmails]);

    console.log(
      "📌 IMAP Search Filter:",
      JSON.stringify(searchFilter, null, 2)
    );

    imap.once("ready", () => {
      console.log("✔ IMAP Connection Ready");

      imap.openBox("[Gmail]/All Mail", false, (err, box) => {
        if (err) {
          console.error("❌ ERROR opening [Gmail]/All Mail:", err);
          return resolve([]);
        }

        console.log(
          `📂 [Gmail]/All Mail Opened | Total Messages: ${box.messages.total}`
        );

        imap.search(searchFilter, (err, uids) => {
          if (err) {
            console.error("❌ SEARCH ERROR:", err);
            imap.end();
            return resolve([]);
          }

          console.log("📨 SEARCH UIDs Returned:", uids);

          if (!uids || uids.length === 0) {
            console.log("⚠ No matching replies found.");
            imap.end();
            return resolve([]);
          }

          const f = imap.fetch(uids, { bodies: "" });

          f.on("message", (msg, seqno) => {
            console.log(`\n📩 MESSAGE #${seqno} START`);

            let buffer = "";

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => {
                buffer += chunk.toString("utf8");
              });
            });

            msg.once("end", () => {
              const parsePromise = (async () => {
                console.log(`📩 [END BODY] Parsing message #${seqno}`);

                try {
                  const parsed = await simpleParser(buffer);

                  let fromRaw =
                    parsed.from?.value?.[0]?.address ||
                    parsed.envelope?.from?.[0] ||
                    parsed.headers?.get("from") ||
                    extractEmailFromBody(parsed.text || parsed.html || "");

                  console.log("🟩 fromRaw before fallback:", fromRaw);

                  if (!fromRaw && msg.envelope?.from) {
                    fromRaw = msg.envelope.from.toString();
                  }

                  console.log("🟩 fromRaw after fallback:", fromRaw);

                  let from = null;
                  if (fromRaw) {
                    const match = fromRaw
                      .toString()
                      .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/);
                    from = match ? match[0].toLowerCase() : null;
                  }

                  console.log("🟩 Final Extracted FROM:", from);

                  if (!from) {
                    console.log("❌ Could not extract FROM email → SKIPPING");
                    return;
                  }

                  const original = parsed.text || parsed.html || "";
                  const clean = original
                    .split(/On .*?,.*?(wrote:|said:)/is)[0]
                    .trim();

                  const finalBody = clean.length > 0 ? clean : original;

                  results.push({ from, body: finalBody, date: parsed.date });

                  console.log("🟩 PUSHED Reply:", {
                    from,
                    body: finalBody.slice(0, 80),
                    date: parsed.date,
                  });
                } catch (err) {
                  console.error("❌ Error parsing message:", err);
                }
              })();

              parsePromises.push(parsePromise);

              console.log(`📩 MESSAGE #${seqno} END`);
            });
          });

          f.once("end", async () => {
            console.log("\n✔ Fetch finished. Waiting for all parsers...");

            await Promise.all(parsePromises);

            console.log(`📊 TOTAL Replies Parsed: ${results.length}`);

            results.sort((a, b) => new Date(b.date) - new Date(a.date));

            resolve(results);
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.error("❌ IMAP CONNECTION ERROR:", err);
      resolve([]);
    });

    imap.once("end", () => {
      console.log("🔚 IMAP Connection Closed.");
      console.log("===== END IMAP FETCH =====\n");
    });

    imap.connect();
  });
};
