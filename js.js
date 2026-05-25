// ==================== 页面切换 ====================
function switchPage(pageId, dom) {
    document.querySelectorAll(".page").forEach(el => el.classList.remove("active"))
    document.getElementById(pageId).classList.add("active")
    document.querySelectorAll(".left-menu div").forEach(el => el.classList.remove("active"))
    if (dom) dom.classList.add("active")
    if (pageId === 'data') refreshData()
}

// 退出登录
function logout() {
    if (confirm("确定退出登录？")) {
        localStorage.removeItem('aiPlanCurrentUser')
        window.location.href = "login.html"
    }
}

// ==================== 用户信息 ====================
function getCurrentUser() {
    return localStorage.getItem('aiPlanCurrentUser') || ''
}

// 显示当前用户
function showUser() {
    let user = getCurrentUser()
    let users = JSON.parse(localStorage.getItem('aiPlanUsers') || '{}')
    let nick = (users[user] && users[user].nickname) || user
    document.getElementById('navUserInfo').textContent = '👤 ' + (nick || '用户')
}

// ==================== 本地存储 ====================
function saveProfile(key, value) {
    let user = getCurrentUser()
    if (!user) return
    let keyName = 'profile_' + user
    let data = JSON.parse(localStorage.getItem(keyName) || '{}')
    data[key] = value
    localStorage.setItem(keyName, JSON.stringify(data))
}

function getProfile(key) {
    let user = getCurrentUser()
    if (!user) return null
    let keyName = 'profile_' + user
    let data = JSON.parse(localStorage.getItem(keyName) || '{}')
    return data[key] !== undefined ? data[key] : null
}

function getAllProfile() {
    let user = getCurrentUser()
    if (!user) return {}
    let keyName = 'profile_' + user
    return JSON.parse(localStorage.getItem(keyName) || '{}')
}

// ==================== 数据中心 ====================
function refreshData() {
    let profile = getAllProfile()
    let askHistory = profile["全部提问"] || ""
    let weakPoints = profile["薄弱短板"] || []
    let planCount = profile["生成计划"] || 0

    let askList = askHistory ? askHistory.split("；").filter(s => s.trim()) : []
    document.getElementById("totalAsk").textContent = askList.length
    document.getElementById("weakCount").textContent = weakPoints.length
    document.getElementById("planCount").textContent = planCount

    document.getElementById("showAllAsk").textContent = askHistory || "暂无记录"
    document.getElementById("showTarget").textContent = profile["学习目标"] || "暂无记录"
    document.getElementById("showWeak").textContent = weakPoints.length > 0 ? weakPoints.join("、") : "暂无记录"
    document.getElementById("showLosePoint").textContent = profile["失分缺点"] || "暂无记录"
}

function clearData() {
    if (confirm("确定清空所有个人学习数据？此操作不可恢复！")) {
        let user = getCurrentUser()
        if (user) localStorage.removeItem('profile_' + user)
        refreshData()
    }
}

// ==================== 智能解析 ====================
function parseUserInput(text) {
    let data = { target: '', weakPoints: [], losePoints: [] }

    // 识别学习目标
    const targets = [
        ['四级', '英语四级备考'], ['六级', '英语六级备考'],
        ['考研', '研究生考试备考'], ['雅思', '雅思考试备考'],
        ['托福', '托福考试备考'], ['计算机二级', '计算机二级备考'],
        ['计算机三级', '计算机三级备考'], ['期末', '期末考试备考'],
        ['中考', '中考备考'], ['高考', '高考备考'],
        ['公务员', '公务员考试备考'], ['教资', '教师资格证备考'],
        ['会计', '会计资格证备考'], ['语文', '语文专项提升'],
        ['数学', '数学专项提升'], ['英语', '英语专项提升'],
        ['生物', '生物基础巩固'], ['化学', '化学基础巩固'],
        ['物理', '物理基础巩固']
    ]
    targets.forEach(([kw, name]) => {
        if (text.includes(kw) && !data.target) data.target = name
    })

    // 识别薄弱点
    const weakMap = [
        ['基础差', '基础薄弱'], ['基础弱', '基础薄弱'],
        ['生物', '生物知识点薄弱'], ['化学', '化学知识点薄弱'],
        ['物理', '物理知识点薄弱'], ['阅读', '阅读理解薄弱'],
        ['作文', '写作能力薄弱'], ['听力', '听力部分薄弱'],
        ['口语', '口语表达薄弱'], ['翻译', '翻译能力薄弱'],
        ['单词', '词汇量不足'], ['语法', '语法基础薄弱'],
        ['函数', '数学函数薄弱'], ['几何', '几何部分薄弱'],
        ['计算', '计算能力薄弱'], ['选择题', '选择题容易丢分'],
        ['大题', '大题解题思路薄弱'], ['填空', '填空题准确率低'],
        ['文言文', '文言文阅读理解薄弱'], ['古诗', '古诗词背诵薄弱']
    ]
    weakMap.forEach(([kw, name]) => {
        if (text.includes(kw) && !data.weakPoints.includes(name)) {
            data.weakPoints.push(name)
        }
    })

    // 识别失分点
    const loseMap = [
        ['粗心', '粗心大意丢分'], ['审题', '审题不清丢分'],
        ['计算错', '计算错误丢分'], ['记不住', '知识点记不住丢分'],
        ['时间不够', '时间不够做不完丢分'], ['紧张', '考试紧张丢分'],
        ['马虎', '马虎大意丢分']
    ]
    loseMap.forEach(([kw, name]) => {
        if (text.includes(kw) && !data.losePoints.includes(name)) {
            data.losePoints.push(name)
        }
    })

    return data
}

// ==================== 豆包AI ====================
const API_KEY = "ark-bdd3985e-3418-489e-9116-9dd6e4e7b9f4-9e6ff"
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

async function sendMessage() {
    let input = document.getElementById("chatInput").value.trim()
    if (!input) return

    // 用户消息
    let chatBox = document.getElementById("chatContent")
    chatBox.innerHTML += `<div class="msg-row user"><div class="msg-bubble">${input}</div></div>`
    document.getElementById("chatInput").value = ""
    chatBox.scrollTop = chatBox.scrollHeight

    // 加载提示
    chatBox.innerHTML += `<div class="msg-row ai"><div class="msg-bubble" id="thinkingMsg">⏳ AI思考中...</div></div>`
    chatBox.scrollTop = chatBox.scrollHeight

    // 隐藏旧结果
    document.getElementById("result").style.display = "none"
    document.getElementById("statBox").style.display = "none"

    try {
        let res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + API_KEY
            },
            body: JSON.stringify({
                model: "ep-20260511204110-nvv5q",
                messages: [
                    { role: "system", content: "你是专业学习规划助手。请根据用户的学习目标、薄弱点和可用时间，生成一份详细、可执行的学习计划。包含：每日任务安排、具体学习方法、推荐学习资料、阶段性目标。回答要结构清晰、具体实用。" },
                    { role: "user", content: input }
                ]
            })
        })

        let result = await res.json()
        let aiAnswer = result.choices[0].message.content

        // 替换"思考中"
        let thinkingEl = document.getElementById("thinkingMsg")
        if (thinkingEl) thinkingEl.textContent = aiAnswer

        // 下方展示详细计划
        let resultEl = document.getElementById("result")
        resultEl.textContent = aiAnswer
        resultEl.style.display = "block"

        // 自动保存
        let data = parseUserInput(input)
        let oldAsk = getProfile("全部提问") || ""
        let newAsk = oldAsk ? oldAsk + "；" + input : input
        saveProfile("全部提问", newAsk)
        if (data.target) saveProfile("学习目标", data.target)
        if (data.weakPoints.length) saveProfile("薄弱短板", data.weakPoints)
        if (data.losePoints.length) saveProfile("失分缺点", data.losePoints.join("、"))
        let oldPlan = getProfile("生成计划") || 0
        saveProfile("生成计划", oldPlan + 1)

        // 学习提醒
        setTimeout(showStudyReminder, 800)

    } catch (err) {
        let thinkingEl = document.getElementById("thinkingMsg")
        if (thinkingEl) {
            thinkingEl.textContent = "❌ 接口连接失败，请检查网络或API密钥配置"
        }
    }
    chatBox.scrollTop = chatBox.scrollHeight
}

// ==================== 学习提醒 ====================
function showStudyReminder() {
    let statBox = document.getElementById("statBox")
    if (document.getElementById("chat").classList.contains("active")) {
        statBox.innerHTML = "🔔 AI提醒：晚上8点，按时开始当日学习训练"
        statBox.style.display = "block"
    }
}

// ==================== 欢迎语 ====================
function updateWelcomeText() {
    let hour = new Date().getHours()
    let text = "欢迎使用AI学习规划助手"
    if (hour < 12) text = "☀️ 早上好，开启一天的学习吧！"
    else if (hour < 18) text = "🌤️ 下午好，继续加油！"
    else text = "🌙 晚上好，坚持学习就是胜利！"
    let el = document.getElementById("welcomeText")
    if (el) el.textContent = text
}

// ==================== Enter发送 ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        let activeChat = document.getElementById("chat").classList.contains("active")
        if (activeChat && document.activeElement === document.getElementById("chatInput")) {
            e.preventDefault()
            sendMessage()
        }
    }
})

// ==================== 初始化 ====================
window.onload = function() {
    // 检查登录
    if (!getCurrentUser()) {
        window.location.href = "login.html"
        return
    }
    showUser()
    updateWelcomeText()
    refreshData()
    setTimeout(showStudyReminder, 4000)

    // 整点检查提醒
    setInterval(() => {
        let now = new Date()
        if (now.getHours() === 20 && now.getMinutes() === 0) {
            showStudyReminder()
        }
    }, 60000)
}
