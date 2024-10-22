const PLACEMENTS_EMAIL = "pesuplacements@pes.edu";
const SHEET_ID = "1mD2tDoXsYfPcc9eYMlHFN4S7_KfQzf-aZsNwPtG9Od8";

function checkEmails() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Sheet1");
  const threads = GmailApp.search(`from:${PLACEMENTS_EMAIL}`);
  threads.forEach((thread) => {
    const messages = thread.getMessages();

    messages.forEach((message) => {
      const subject = message.getSubject();
      const body = message.getBody();
      const companyMatch = extractCompanyName(subject, body) || "Unknown";
      const dateMailMatch = body.match(/Date of Mail:\s*(\d{2}\/\d{2}\/\d{4})/);
      const lastDateRegisterMatch = body.match(/Last Date to Register:\s*(.+)/);
      const prePlacementTalkMatch = body.match(/Pre Placement Talk:\s*(.+)/);
      const codingTestDateMatch = body.match(/Coding Test Date:\s*(.+)/);
      const interviewDateMatch = body.match(/Interview:\s*(.+)/);

      const company = companyMatch ? companyMatch[1] : "Unknown";
      const dateMail = dateMailMatch ? dateMailMatch[1] : "Unknown";
      const lastDateRegister = lastDateRegisterMatch
        ? lastDateRegisterMatch[1]
        : "Unknown";
      const prePlacementTalk = prePlacementTalkMatch
        ? prePlacementTalkMatch[1]
        : "Unknown";
      const codingTestDate = codingTestDateMatch
        ? codingTestDateMatch[1]
        : "Unknown";
      const interviewDate = interviewDateMatch
        ? interviewDateMatch[1]
        : "Unknown";

      const data = sheet.getDataRange().getValues();
      let updated = false;

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === company) {
          if (data[i][1] !== dateMail)
            sheet.getRange(i + 1, 2).setValue(dateMail);
          if (data[i][2] !== lastDateRegister)
            sheet.getRange(i + 1, 3).setValue(lastDateRegister);
          if (data[i][3] !== prePlacementTalk)
            sheet.getRange(i + 1, 4).setValue(prePlacementTalk);
          if (data[i][4] !== codingTestDate)
            sheet.getRange(i + 1, 5).setValue(codingTestDate);
          if (data[i][5] !== interviewDate)
            sheet.getRange(i + 1, 6).setValue(interviewDate);

          updated = true;
        }
      }
      if (!updated) {
        sheet.appendRow([
          company,
          dateMail,
          lastDateRegister,
          prePlacementTalk,
          codingTestDate,
          interviewDate,
        ]);
      }
    });
  });
}

function extractCompanyName(subject, body) {
  const patterns = [
    /(?:Career\s+Opportunity|Job\s+Opening|Placement\s+Drive|Recruitment\s+Drive)\s+(?:at|with|for)\s+([A-Z][A-Za-z0-9\s&]+(?:\s+(?:Inc\.|Corp\.|LLC|Ltd\.|Limited|Corporation|Company))?)/i,
    /([A-Z][A-Za-z0-9\s&]+(?:\s+(?:Inc\.|Corp\.|LLC|Ltd\.|Limited|Corporation|Company))?)\s+(?:is\s+hiring|is\s+recruiting|has\s+openings)/i,
    /([A-Z][A-Za-z0-9\s&]+)\s+(?:Campus\s+Recruitment|Campus\s+Placements|Campus\s+Drive)/i,
    /Regarding\s+([A-Z][A-Za-z0-9\s&]+)/i,
    /([A-Z][A-Za-z0-9\s&]+)\s+(?:Off\s+Campus|On\s+Campus)\s+Drive/i,
  ];

  for (let pattern of patterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  for (let pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const inferredCompanyName = GeminiModelInference(subject, body);
  if (inferredCompanyName) {
    return inferredCompanyName;
  }

  return "Unknown";
}

function createTimeDrivenTrigger() {
  ScriptApp.newTrigger("checkEmails").timeBased().everyHours(1).create();
}

function inferCompanyNameFromText(subject, body) {
  const probableCompanyName = GeminiModelInference(subject, body);
  return probableCompanyName;
}

function GeminiModelInference(subject, body) {
  const prompt = `
  From the following email subject and body, extract the most likely company name involved in a recruitment or placement drive:

  Subject: ${subject}
  Body: ${body}

  The company name should be in a clean, extractable format, such as "Acme Inc." or "GlobalTech Ltd.". If no company is found, return "Unknown".
  `;

  const apiKey = "AIzaSyB4PIPyPYTEfanBk8f7ehdl1ksjA9LayOc";
  const response = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
    method: "POST",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    payload: JSON.stringify({
      model: "gemini-1.0",
      prompt: prompt,
      max_tokens: 50,
    }),
  });

  const json = JSON.parse(response.getContentText());
  const probableCompanyName = json.choices[0].text.trim();

  return probableCompanyName || null;
}

function myFunction() {
  console.log("Hello world, testing");
  return 1 + 1;
}
