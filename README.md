# tampermonkey-jira-createTicket

### Install scripts

1. Install Chrome extension Tampermonkey
2. Create new scripts -> Utilities tab -> Install from URL:
   https://git.xxx.com/rwcc/tools/tampermonkey-createJiraTicket/-/raw/master/createJiraTicket.js
3. Click install
4. Replace it with your own jira token !
   Or set the jiraToken field in the tampermonkey storage !
   Where is Tampermonkey's "Storage" tab? [Link](https://stackoverflow.com/questions/56918239/where-is-tampermonkeys-storage-tab-to-edit-the-storage-content)


### Use the steps Description

1. Please grant the browser permission. After the ticket is created, the ticket page is automatically opened.
- Go to Chrome Settings
- Search 'Pop-ups and redirects'   
- Enable 'Sites can send pop-ups and use redirects'
  
2. Go to MR page and create a Jira ticket. 

Some default values have been set:
- storyProint: 1 (editable)
- ticket name, description (non editable and invisible)
- related to origin ticket (non editable and invisible)
- other neccessary settings, such as project, issuetype, sprint, Epic link (non editable and invisible)

1. If creating successfully, it will open jira page in a new Tab.
   

### Notice

If creating ticket fails, please get more information from console log.
