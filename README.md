# Focusboard Cloud (Minest)

> **Focusboard 8.0** · 悬停优先级三点直选 [🔴 🟡 🟢]、严格居中打钩圆圈、标题色彩点对齐、默认时间排序、Liquid Glass 3D Cover Flow 视效管理看板、主动提取闪卡系统 & 原生 Trello 风格卡片封面系统。

---

## 📱 核心版本与文件结构

| 文件 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| **`index.html`** | **自适应路由器入口** | 桌面端自动跳转 `web8.0.html`，移动端自动跳转 `iphone.html` |
| **`web8.0.html`** | **最新旗舰桌面版 (8.0)** | 悬停优先级直选按钮、严格居中打钩圈、列表时间默认排序、纯英文沉浸式 UI、原生 Trello 封面、Liquid Glass |
| **`web7.0.html`** | **桌面版官方存档 (7.0)** | 经典 7.0 视觉版存档 |
| **`iphone.html`** | **iPhone 15 Pro 伴侣版** | 专为移动端与竖屏设计，灵动岛两翼环抱导航、32px 大圆角触控优化 |
| **`web6.0.html`** | **桌面版官方存档 (6.0)** | 经典中英双语版存档 |
| **`iphone1.0.html`** | **移动版官方存档 (1.0)** | 经典 iPhone 初代伴侣版存档 |
| **`start.sh`** | **Mac 一键启动脚本** | 双击或终端运行，自动启动本地静态服务器并打开浏览器 |

---

## 🚀 在 Mac mini 上快速启动

本项目为纯前端轻量化应用，**无需安装 Node.js、无需构建、零额外依赖**：

### 方法一：使用一键启动脚本
在 Mac mini 的终端中进入该目录运行：
```bash
./start.sh
```
或直接在 Finder 中双击 `start.sh`（或通过终端执行），系统会自动启动服务并在默认浏览器打开 `http://localhost:3005`。

### 方法二：Python 本地服务器（原生内置）
```bash
cd ~/Documents/minest
python3 -m http.server 3005
```
然后在浏览器访问：`http://localhost:3005`。

---

## 📦 迁移到 Mac mini 的 3 种途径

### 途径 1：隔空投送 (AirDrop) —— 最推荐、最快捷 ⚡️
1. 在当前 MacBook 上，在 Finder 中打开 `/Users/cece/Documents`。
2. 右键点击 `minest` 文件夹（或压缩包 `focusboard-minest.zip`）。
3. 选择 **共享 -> 隔空投送 (AirDrop)**，投送给你的 **Mac mini**。
4. 在 Mac mini 接收后，将其放置于 `~/Documents/minest` 即可。

### 途径 2：局域网一键同步 (rsync) 🚀
如果两台 Mac 连接在同一个局域网（Wi-Fi 或同一路由器网线）：
在当前 MacBook 终端执行一行命令（将 `<mac-mini-ip>` 换成 Mac mini 的局域网 IP，如 `192.168.1.100` 或主机名）：
```bash
rsync -avz --exclude '.git' /Users/cece/Documents/minest/ cece@<mac-mini-ip>:~/Documents/minest/
```

### 途径 3：Git / GitHub 同步 🐙
当前目录已完成本地 Git 仓库初始化与全量 Commit：
```bash
# 1. 在 GitHub 创建新仓库 focusboard 后：
git remote add origin https://github.com/<你的用户名>/focusboard.git
git branch -M main
git push -u origin main

# 2. 在 Mac mini 上直接克隆：
git clone https://github.com/<你的用户名>/focusboard.git ~/Documents/minest
```

---

## 💾 看板数据迁移指南（卡片、封面与标签）

Focusboard 的所有卡片数据与封面偏好默认存储在浏览器的安全本地沙箱（`localStorage`）中：

1. **在当前 MacBook 上导出数据**：
   - 打开看板，点击顶部右侧的 **设置齿轮图标 (⚙️ Board Settings)**。
   - 点击 **`JSON Backup`** 按钮，浏览器会自动下载包含全部看板、列表与卡片的备份文件（如 `focusboard-backup-2026-09-19.json`）。
2. **导入到 Mac mini**：
   - 将该 `.json` 备份文件传到 Mac mini（或隔空投送）。
   - 在 Mac mini 的浏览器中打开 Focusboard，点击右上方 **设置 (⚙️)** -> 点击 **`Import`**，选择该 `.json` 文件即可一键无缝还原所有数据！
