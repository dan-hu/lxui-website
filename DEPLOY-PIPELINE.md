# 芝诚官网 · Git 自动部署流水线说明

## 架构

```
本地（这台 Mac）                Gitee                GitHub                网站服务器
    │  git push                  │                    │                      │
    ├──────────────────────────> │  主仓库（国内快）    │                      │
    │                            │                    │                      │
    │        GitHub Actions 每10分钟镜像同步（sync-deploy.yml 的 sync 作业） │
    │                            ├──────────────────> │                      │
    │                            │                    │ 检测到新提交          │
    │                            │                    │ 自动部署（deploy 作业）│
    │                            │                    ├─────────────────────>│
    │                            │                    │  FTP / rsync         │
```

- Gitee 是唯一推送入口（国内网络推拉都快），Dan 的 gitee 帐号 `danhu2026` 加为开发者可随时查看/协作
- GitHub 仓库是"影子仓库"，由 Actions 自动保持同步，人不直接碰它
- 部署方式等服务器方（Dan）确认：FTP 上传 或 SSH/rsync，workflow 里两种都已写好，取消注释即可

## 需要的账号与凭据

| 项 | 谁提供 | 用途 |
|---|---|---|
| Gitee 账号 + 空仓库 `lxui-website` | 用户注册创建 | 主代码仓库 |
| Gitee 私人令牌（勾 projects 权限） | 用户在 Gitee「设置→私人令牌」生成 | GitHub Actions 拉取 Gitee |
| GitHub 账号 + 空仓库 | 用户注册创建（或 Dan 建） | Actions 运行 + 影子仓库 |
| 部署凭据（FTP 账号 或 SSH 私钥） | Dan | Actions 自动上传网站文件到服务器 |

## 上线后日常更新流程

1. 改页面（WorkBuddy 改完自检）
2. `git add -A && git commit -m "..." && git push`（只推 Gitee）
3. 最多 10 分钟后自动同步 + 自动部署上线
4. 紧急更新可在 GitHub Actions 页面手动 Run workflow 立即触发
