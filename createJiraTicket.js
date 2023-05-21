// ==UserScript==
// @name         create jira ticket
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  help us create cr ticket faster & easier!
// @author       Vinson.Feng
// @icon         https://www.google.com/s2/favicons?domain=xxx.com
// @match        https://git.xxx.com/RND/rwc/-/merge_requests/*
// @match        https://jira.xxx.com/browse/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      *
// ==/UserScript==
const isRwcMRPage = /\/rwc\/-\/merge_requests\//.test(window.location.pathname);
const JIRA_BASE_URL = 'https://jira.xxx.com';
const isJiraPage = window.location.href.includes(`${JIRA_BASE_URL}/browse/RCV-`);
const GROUPS = ['Web_4', 'Web_5', 'Web_6'];
const ISSUE_TYPE = {
  TASK: '7',
};
const BUTTON_TEXT = {
    CR: 'Create CR Ticket',
    NORMAL: 'Create Normal Ticket',
    LOADING: 'Loading~'
};
const BTN_LOADING_CLASSNAME = 'create-cr-ticket-btn-loading';
const CR_PREFIX = '[CR]';
const btnStyle = `
    .create-cr-ticket-wrap {
        position: fixed;
        z-index: 9999;
        top: 100px;
        right: 300px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.24);
        padding: 10px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
        box-sizing: border-box;
    }
    .hide {
        height: 46px;
        width: 100px;
    }
    .create-cr-ticket-wrap input, .create-cr-ticket-wrap textarea, .create-cr-ticket-wrap select {
        width: 180px;
        max-width: 180px;
        border-radius: 0.25rem;
        border-width: 2px;
        word-break: break-all;
        box-sizing: border-box;
    }
    .create-cr-ticket-wrap select {
        font-size: 10px;
    }
    .inputWrap {
        display: flex;
        justify-content: space-between;
        padding-bottom: 8px;
        width: 100%;
        align-items: center;
    }
    .create-cr-ticket-btn {
        width: 100%;
        height: 36px;
        border: none;
        outline: none;
        background-color: rgba(9,30,66,.08);
        color: #344563;
        cursor: pointer;
        border-radius: 6px;
        transition: .3s;
        margin-top: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .create-cr-ticket-btn:hover {
        background-color: rgba(9,30,66,.13);
    }
    .create-cr-ticket-btn:active {
        background: #ddd;
    }
    .create-cr-ticket-btn:focus {
        outline: 0;
        outline: none;
    }
    .${BTN_LOADING_CLASSNAME}::after {
        content: '';
        position: relative;
        width: 16px;
        height: 16px;
        border: 2px solid #fff;
        border-top-color: #999;
        border-right-color: #999;
        border-bottom-color: #999;
        border-radius: 100%;
        margin-left: 10px;
        animation: circle infinite 0.75s linear;
        display: block;
    }
    @keyframes circle {
        0% {
            transform: rotate(0);
        }
        100% {
            transform: rotate(360deg);
        }
    }
    .edit-btn {
        background-color: rgba(9,30,66,.08);
        color: #344563;
        text-decoration: none;
        border-radius: 3px;
        width: 80px;
        text-align: center;
        margin-bottom: 10px;
        cursor: pointer;
        padding: 3px;
    }
    .edit-btn:hover {
        background-color: rgba(9,30,66,.13);
    }
    .info {
        width: 180px;
        word-break: break-all;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .toggle-btn {
        background-color: rgba(9,30,66,.08);
        color: #344563;
        text-decoration: none;
        border-radius: 3px;
        width: 80px;
        text-align: center;
        margin-bottom: 10px;
        cursor: pointer;
        padding: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .toggle-btn::after {
        content: '';
        display: block;
        margin: 5px 5px 0 10px;
        box-sizing: border-box;
        width: 10px;
        height: 10px;
        border: solid #999;
        border-width: 0 2px 2px 0;
        transform: rotate(-135deg);
    }
    .toggle-btn:hover {
        background-color: rgba(9,30,66,.13);
    }
    .hide .toggle-btn::after {
        margin: 0px 5px 5px 10px;
        transform: rotate(45deg);
    }
    .create-cr-ticket-divider {
        clear: both;
        box-sizing: border-box;
        line-height: 1.5715;
        width: 100%;
        min-width: 100%;
        display: flex;
        margin: 16px 0;
        color: #000000d9;
        font-weight: 500;
        font-size: 16px;
        white-space: nowrap;
        text-align: center;
        border-top: 0;
        border-top-color: #ddd;
        overflow: hidden;
    }
    .create-cr-ticket-divider::before, .create-cr-ticket-divider::after {
        top: 50%;
        width: 5%;
        border-top: 1px solid transparent;
        border-top-color: inherit;
        border-bottom: 0;
        transform: translateY(50%);
        content: "";
        flex-shrink: 0;
    }
    .create-cr-ticket-divider::after  {
        width: 95%;
    }
    .create-cr-ticket-divider-text {
        color: #000000d9;
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
        text-align: center;
        display: inline-block;
        padding: 0 1em;
        flex-shrink: 0;
    }
`
const request = ({
    method = 'get',
    url,
    ...options
}) => {
    const token = GM_getValue('jiraToken');
    GM_setValue('jiraToken', token);
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: method,
            url: `${JIRA_BASE_URL}${url}`,
            headers: isJiraPage && method === 'get' ? {} : {
                'X-Atlassian-Token': 'nocheck',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'dummyValue',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            rejectUnauthorized: true,
            ...options,
            onload: (res) => {
                console.log(`${url}---success:::`, res)
                if (res.status >= 200 && res.status < 300) {
                    resolve(res.responseText && JSON.parse(res.responseText) || {});
                } else {
                    reject(res);
                }
            },
            onerror: reject,
        });
    })
}
const renderDivider = (wrap, text) => {
    const dividerEle = document.createElement('div');
    dividerEle.className = 'create-cr-ticket-divider';
    dividerEle.innerHTML = `<div class="create-cr-ticket-divider-text">${text}</div>`;
    wrap.appendChild(dividerEle);
}

const renderCreateCRTicket = ({
    result,
    wrap,
    ticketNum,
    groups,
}) => {
    const [ticketRes, userRes] = result;
    renderDivider(wrap, 'Create CR Ticket');
    const assigneeWrap = document.createElement('div');
    assigneeWrap.className = 'inputWrap';
    assigneeWrap.innerHTML = 'assignee:';
    let assigneeInput, assigneeInfo, defaultAssignee = '', loading = false;
    if (ticketRes.fields?.assignee?.name !== userRes.name) {
        defaultAssignee = userRes.name;
    }
    const renderAssigneeInput = () => {
        assigneeInput = document.createElement('input');
        assigneeInput.value = defaultAssignee;
        assigneeInput.type = 'text';
        assigneeWrap.appendChild(assigneeInput);
    }
    if (isJiraPage) {
        assigneeInfo = document.createElement('div');
        assigneeInfo.className = 'info';
        assigneeInfo.innerHTML = defaultAssignee;
        assigneeWrap.appendChild(assigneeInfo);
    } else {
        renderAssigneeInput();
    }
    const storyPointWrap = document.createElement('div');
    storyPointWrap.className = 'inputWrap';
    storyPointWrap.innerHTML = 'storyPoint:';
    let storyPointInput, storyPointInfo;
    const renderStoryPointInput = () => {
        storyPointInput = document.createElement('input');
        storyPointInput.value = 1;
        storyPointInput.type = 'number';
        storyPointWrap.appendChild(storyPointInput);
    }
    if (isJiraPage) {
        storyPointInfo = document.createElement('div');
        storyPointInfo.className = 'info';
        storyPointInfo.innerHTML = 1;
        storyPointWrap.appendChild(storyPointInfo);
    } else {
        renderStoryPointInput();
    }

    const btn = document.createElement('button');
    btn.className = 'create-cr-ticket-btn';
    btn.innerText = BUTTON_TEXT.CR;
    wrap.appendChild(assigneeWrap);
    wrap.appendChild(storyPointWrap);
    if(isJiraPage) {
        const editBtn = document.createElement('div');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = 'edit info';
        editBtn.addEventListener('click', () => {
            assigneeWrap.removeChild(assigneeInfo);
            storyPointWrap.removeChild(storyPointInfo);
            renderAssigneeInput();
            renderStoryPointInput();
            wrap.removeChild(editBtn);
        })
        wrap.appendChild(editBtn);
    }
    wrap.appendChild(btn);
    btn.addEventListener('click', async () => {
        const fields = ticketRes.fields;
        if (!fields.customfield_10652) {
            window.alert(`Please set Sprint for ${ticketNum} first`);
            return;
        }
        const summary = fields.summary;
        if (!summary) {
            window.alert(`${ticketNum} does not have title`);
            return;
        }
        const assigneeName = assigneeInput?.value || defaultAssignee;
        if (fields.assignee?.name === assigneeName) {
            window.alert(`Please replace assignee!`);
            return;
        }
        if (loading) return;
        loading = true;
        btn.innerText = BUTTON_TEXT.LOADING;
        btn.classList.add(BTN_LOADING_CLASSNAME);
        const title = summary.split(']').slice(-1)[0]?.trim();
        const matched = fields.customfield_10652[0].match(/id=\d*/);
        const sprintNumber = Number.parseInt(matched[0].substring(3));
        try {
            const newIssue = await request({
                url: '/rest/api/2/issue',
                method: 'post',
                data: JSON.stringify({
                    "update": {},
                    "fields": {
                        "customfield_10652": sprintNumber,
                        "customfield_22018": groups,
                        "customfield_24773": fields.customfield_24773,
                        "customfield_11450": fields.customfield_11450,
                        "customfield_10422": Number(storyPointInput?.value || 1),
                        "summary": `${CR_PREFIX}${ticketNum}-${assigneeName && `${assigneeName}-` || ''}${title}`,
                        "description": "This ticket is created by tampermonkey script for code review",
                        "project": fields.project,
                        "issuetype": {
                            "id": ISSUE_TYPE.TASK,
                        },
                        "fixVersions": [],
                        "assignee": {
                            name: assigneeName,
                        },
                        "reporter": {
                            name: fields.assignee.name,
                        }
                    },
                })
            })
            await request({
                url: '/rest/api/2/issueLink',
                method: 'post',
                data: JSON.stringify({
                    outwardIssue: { key: ticketNum },
                    inwardIssue: { key: newIssue.key },
                    type: { name: "Relates" },
                })
            })
            const openUrl = `${JIRA_BASE_URL}/browse/${newIssue.key}`;
            console.log('success---openUrl:::', openUrl);
            window.open(openUrl);
        } catch (error) {
            console.log('create cr issue---error:::', error)
        }
        loading = false;
        btn.innerText = BUTTON_TEXT.CR;
        btn.classList.remove(BTN_LOADING_CLASSNAME);
    })
}
const renderCreateNormalTicket = ({
    result,
    wrap,
    ticketNum,
    groups,
}) => {
    const ticketRes = result[0];
    renderDivider(wrap, 'Create Normal Ticket');
    const assigneeWrap = document.createElement('div');
    assigneeWrap.className = 'inputWrap';
    assigneeWrap.innerHTML = 'assignee:';
    let assigneeInput, assigneeInfo, defaultAssignee = '', loading = false;
    const renderAssigneeInput = () => {
        assigneeInput = document.createElement('input');
        assigneeInput.value = defaultAssignee;
        assigneeInput.type = 'text';
        assigneeWrap.appendChild(assigneeInput);
    }
    if (isJiraPage) {
        assigneeInfo = document.createElement('div');
        assigneeInfo.className = 'info';
        assigneeInfo.innerHTML = defaultAssignee;
        assigneeWrap.appendChild(assigneeInfo);
    } else {
        renderAssigneeInput();
    }

    const storyPointWrap = document.createElement('div');
    storyPointWrap.className = 'inputWrap';
    storyPointWrap.innerHTML = 'storyPoint:';
    let storyPointInput, storyPointInfo;
    const renderStoryPointInput = () => {
        storyPointInput = document.createElement('input');
        storyPointInput.value = 3;
        storyPointInput.type = 'number';
        storyPointWrap.appendChild(storyPointInput);
    }
    if (isJiraPage) {
        storyPointInfo = document.createElement('div');
        storyPointInfo.className = 'info';
        storyPointInfo.innerHTML = 3;
        storyPointWrap.appendChild(storyPointInfo);
    } else {
        renderStoryPointInput();
    }

    const summaryWrap = document.createElement('div');
    summaryWrap.className = 'inputWrap';
    summaryWrap.innerHTML = 'summary:';
    let summaryInput, summaryInfo;
    const renderSummaryInput = () => {
        summaryInput = document.createElement('textarea');
        summaryInput.value = ticketRes.fields.summary;
        summaryInput.type = 'text';
        summaryWrap.appendChild(summaryInput);
    }
    if (isJiraPage) {
        summaryInfo = document.createElement('div');
        summaryInfo.className = 'info';
        summaryInfo.innerHTML = ticketRes.fields.summary;
        summaryWrap.appendChild(summaryInfo);
    } else {
        renderSummaryInput();
    }

    const epicLinkList = GM_getValue('epicLinkList');
    const epicLinkWrap = document.createElement('div');
    epicLinkWrap.className = 'inputWrap';
    epicLinkWrap.innerHTML = 'epicLink:';
    let epicLinkInput = document.createElement('select');
    if (epicLinkList instanceof Array && epicLinkList.length > 0) {
        const renderEpicLinkInput = () => {
            Promise.all(epicLinkList.map(epicLinkNum => request({
                url: `/rest/api/2/issue/${epicLinkNum}`
            }))).then(epicLinks => {
                let str = '';
                epicLinks.map(epicLink => {
                    str = str + `<option value ="${epicLink.key}">${epicLink.fields.summary}</option>`
                })
                epicLinkInput.innerHTML = str;
                if (epicLinkList.includes(ticketRes.fields.customfield_11450)) epicLinkInput.value = ticketRes.fields.customfield_11450;
                epicLinkWrap.appendChild(epicLinkInput);
                if (editBtn) {
                    wrap.insertBefore(epicLinkWrap, editBtn);
                } else {
                    wrap.insertBefore(epicLinkWrap, btn);
                }
            })
        }
        renderEpicLinkInput();
    }
    
    const btn = document.createElement('button');
    btn.className = 'create-cr-ticket-btn';
    btn.innerText = BUTTON_TEXT.NORMAL;
    wrap.appendChild(assigneeWrap);
    wrap.appendChild(storyPointWrap);
    wrap.appendChild(summaryWrap);
    let editBtn;
    if(isJiraPage) {
        editBtn = document.createElement('div');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = 'edit info';
        editBtn.addEventListener('click', () => {
            assigneeWrap.removeChild(assigneeInfo);
            storyPointWrap.removeChild(storyPointInfo);
            summaryWrap.removeChild(summaryInfo);
            renderAssigneeInput();
            renderStoryPointInput();
            renderSummaryInput();
            wrap.removeChild(editBtn);
        })
        wrap.appendChild(editBtn);
    }
    wrap.appendChild(btn);

    btn.addEventListener('click', async () => {
        const fields = ticketRes.fields;
        if (!fields.customfield_10652) {
            window.alert(`Please set Sprint for ${ticketNum} first`);
            return;
        }
        const summary = fields.summary;
        if (!summary) {
            window.alert(`${ticketNum} does not have title`);
            return;
        }
        const assigneeName = assigneeInput?.value || defaultAssignee;
        const title = summaryInput?.value || summary;
        if (loading) return;
        loading = true;
        btn.innerText = BUTTON_TEXT.LOADING;
        btn.classList.add(BTN_LOADING_CLASSNAME);
        const matched = fields.customfield_10652[0].match(/id=\d*/);
        const sprintNumber = Number.parseInt(matched[0].substring(3));
        try {
            const newIssue = await request({
                url: '/rest/api/2/issue',
                method: 'post',
                data: JSON.stringify({
                    "update": {},
                    "fields": {
                        "customfield_10652": sprintNumber,
                        "customfield_22018": groups,
                        "customfield_24773": fields.customfield_24773,
                        "customfield_11450": epicLinkInput?.value || fields.customfield_11450,
                        "customfield_10422": Number(storyPointInput?.value || 3),
                        "summary": title,
                        "description": "",
                        "project": fields.project,
                        "issuetype": {
                            "id": ISSUE_TYPE.TASK,
                        },
                        "fixVersions": [],
                        "assignee": {
                            name: assigneeName,
                        },
                    },
                })
            })
            const openUrl = `${JIRA_BASE_URL}/browse/${newIssue.key}`;
            console.log('success---openUrl:::', openUrl);
            window.open(openUrl);
        } catch (error) {
            console.log('create normal issue---error:::', error)
        }
        loading = false;
        btn.innerText = BUTTON_TEXT.NORMAL;
        btn.classList.remove(BTN_LOADING_CLASSNAME);
    })
}

(function() {
    'use strict';
    let ticketNum, isOpen = false;
    if(isRwcMRPage) {
        const link = document.querySelector('a.gfm-issue');
        ticketNum = link.getAttribute('data-external-issue');
    } else if(isJiraPage) {
        const summaryEle = document.querySelector('#summary-val');
        if (!summaryEle || summaryEle.innerHTML.includes(CR_PREFIX)) return;
        ticketNum = window.location.pathname.slice(8)
    }
    if (!ticketNum) return;
    Promise.all([request({
        url: `/rest/api/2/issue/${ticketNum}`
    }), request({
        url: `/rest/api/2/myself`
    })]).then(result => {
        const [ticketRes] = result;
        const body = document.body
        const renderCRWrap = () => {
            const groups = ticketRes.fields.customfield_22018;
            const group = groups[0].value
            if (!GROUPS.includes(group)) return;

            GM_addStyle(btnStyle)
            const wrap = document.createElement('div')
            wrap.className = `create-cr-ticket-wrap ${isOpen ? '' : 'hide'}`;
            const toggleBtn = document.createElement('div');
            toggleBtn.className = 'toggle-btn';
            toggleBtn.innerHTML = isOpen ? 'hide' : 'open';
            toggleBtn.addEventListener('click', () => {
                isOpen = !isOpen;
                if (isOpen) {
                    wrap.classList.remove('hide');
                } else {
                    wrap.classList.add('hide');
                }
                toggleBtn.innerHTML = isOpen ? 'hide' : 'open';
            })
            wrap.appendChild(toggleBtn);
            renderCreateCRTicket({
                result,
                wrap,
                ticketNum,
                groups,
            });
            renderCreateNormalTicket({
                result,
                wrap,
                ticketNum,
                groups,
            });

            body.appendChild(wrap);
        }
        renderCRWrap();
    })
})();