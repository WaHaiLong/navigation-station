# 导航站

一个简约、可自由拖拽的网页导航站，支持自定义网站管理。

## 功能特点

- 🎯 **自由拖拽**：网站卡片可以拖动到页面任意位置
- 🖱️ **双击打开**：双击网站卡片即可在新标签页打开
- ➕ **添加网站**：轻松添加常用网站
- 🗑️ **删除网站**：鼠标悬停显示删除按钮
- 💾 **本地保存**：所有数据保存在浏览器本地，刷新不丢失
- ☁️ **云端同步**：支持 GitHub Gist 同步，可在不同浏览器/设备间同步数据
- 🎨 **简约设计**：极简界面，专注内容

## 使用方法

### 添加网站
1. 点击页面底部的"添加网站"按钮
2. 输入网站名称和网址
3. 点击"添加"按钮

### 打开网站
- **双击**网站卡片即可在新标签页打开

### 移动网站
- **单击并拖动**网站卡片到任意位置
- 位置会自动保存

### 删除网站
- 鼠标**悬停**在网站卡片上
- 点击右上角的 **×** 按钮

### 云端同步（GitHub Gist）

#### 首次设置
1. 点击页面底部的"⚙️ 设置"按钮
2. 获取 GitHub Personal Access Token：
   - 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - 点击 "Generate new token (classic)"
   - 勾选 `gist` 权限
   - 生成并复制 Token
3. 在设置页面输入 Token 并点击"保存Token"
4. 系统会自动创建 Gist 并连接

#### 同步数据
- **同步到云端**：点击"同步到云端"按钮，将本地数据上传
- **从云端同步**：点击"从云端同步"按钮，下载云端数据
- **自动同步**：添加、删除或移动网站后会自动同步到云端

#### 在不同浏览器使用
1. 在新浏览器中打开网站
2. 进入设置页面，输入相同的 GitHub Token
3. 点击"从云端同步"即可获取所有数据

## 技术栈

- 纯 HTML/CSS/JavaScript
- 无依赖，无需构建
- 使用 localStorage 存储数据

## 在线访问

🌐 [GitHub Pages](https://wahailong.github.io/navigation-station/)

## 本地运行

1. 克隆仓库
```bash
git clone https://github.com/WaHaiLong/navigation-station.git
```

2. 打开 `index.html` 文件即可使用

## 浏览器支持

支持所有现代浏览器（Chrome、Firefox、Safari、Edge等）

## 许可证

MIT License
