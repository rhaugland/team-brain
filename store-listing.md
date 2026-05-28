# Chrome Web Store Listing

## Name
Team Brain

## Short Description (132 chars max)
Passively captures your browsing activity to build a team skill profile. Know who knows what.

## Description
Team Brain silently tracks your work-related browsing — docs, tutorials, GitHub repos, technical videos — and extracts the skills you're building. At the end of each day, it creates a skill profile that your team can search.

**How it works:**
- Runs silently in the background
- Automatically filters out personal browsing (social media, email, shopping)
- Sends a daily summary to an AI that identifies skills and learnings
- Results appear in a shared team dashboard

**What it captures:**
- Technical documentation you read
- GitHub repos and code you review
- Tutorial videos you watch
- Stack Overflow and developer forums

**What it ignores:**
- Social media, email, shopping, entertainment, news, banking
- Pages you view for less than 30 seconds

**Privacy first:**
- All data stays on your local machine
- Personal browsing is filtered out immediately — never stored
- You can pause tracking anytime

**Requires:** A local companion process (included) to store data and run the daily analysis.

## Category
Productivity

## Language
English

## Screenshots needed
1. Extension popup showing "Tracking" status with signal count
2. Team Brain dashboard — Skills tab with person cards
3. Team Brain dashboard — Learnings tab with insight cards

## Publishing steps
1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 one-time registration fee (if not already registered)
3. Click "New Item"
4. Upload the extension zip (see below)
5. Fill in the listing details from above
6. Upload screenshots
7. Set privacy policy URL (host privacy-policy.html somewhere, or paste inline)
8. Set visibility to "Unlisted" (only people with direct link can find it)
9. Submit for review (usually 1-3 business days)

## Creating the zip
```bash
cd ~/team-brain/extension && zip -r ../team-brain-extension.zip . -x ".*"
```
