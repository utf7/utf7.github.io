---
layout: post
title: Git配置多个ssh账户
description: Git配置多个ssh账户
categories: Git
keywords: git,github
---

## 摘要

 我们在日常工作中会遇到公司有个git仓库，还有些自己的一些项目放在github上。这样就导致我们要配置不同的ssh-key对应不同的环境。下面我们来看看具体的操作：

1. **生成一个公司用的SSH-Key**      

 `$ ssh-keygen -t rsa -C "xxx@xxx.com” -f ~/.ssh/id_rsa`

在~/.ssh/目录会生成id_rsa和id_rsa.pub私钥和公钥。

我们将id_rsa.pub中的内容粘帖到公司git服务器的SSH-key的配置中。

2. **生成一个github用的SSH-Key**

 $ ssh-keygen -t rsa -C "yyy@yyy.com” -f ~/.ssh/github-rsa
在~/.ssh/目录会生成github_rsa和github_rsa.pub私钥和公钥。

我们将github_rsa.pub中的内容粘帖到github服务器的SSH-key的配置中。

3. **添加私钥**

```bash
$ ssh-add ~/.ssh/id_rsa 
$ ssh-add ~/.ssh/github_rsa
```
如果执行ssh-add时提示"Could not open a connection to your authentication agent"，可以现执行命令：

$ **ssh-agent bash**

然后再运行ssh-add命令。
```bash
$ ssh-add ~/.ssh/id_rsa 
$ ssh-add ~/.ssh/github_rsa
```
# 可以通过 ssh-add -l 来确私钥列表
$ ssh-add -l
# 可以通过 ssh-add -D 来清空私钥列表
$ ssh-add -D


4. **修改配置文件**

在 ~/.ssh 目录下新建一个config文件,添加内容：
注意此步骤建议使用touch config生成配置文件（防止window记事本生成windows格式，ansi编码的文件）
```
#Default commpany user(xxx@xxx.com)
Host gerrit.xxx.com 
 HostName gerrit.xxx.com
 User utf7
 PreferredAuthentications publickey
 IdentityFile ~/.ssh/id_rsa
# second user(yyy@yyy.com)
Host github.com
 HostName github.com
 User utf7
 PreferredAuthentications publickey
 IdentityFile ~/.ssh/github_rsa
```
5，目录结构

```bash
$ ls -lh ~/.ssh/
-rw-r--r-- 1 utf7 197121  344 九月 22 07:42 config
-rw-r--r-- 1 utf7 197121 1.7K 九月 22 07:28 github_rsa
-rw-r--r-- 1 utf7 197121  402 九月 22 07:28 github_rsa.pub
-rw-r--r-- 1 utf7 197121 1.7K 五月 30 06:30 id_rsa
-rw-r--r-- 1 utf7 197121  413 五月 30 06:30 id_rsa.pub
-rw-r--r-- 1 utf7 197121 1.3K 九月 22 06:39 known_hosts
```

 
6，测试

$ ssh -T git@github.com
输出
Hi utf7! You've successfully authenticated, but GitHub does not provide shell access.
就表示成功的连上github了.也可以试试链接公司的git仓库中.




注意此时默认的git用户还是默认的账户

查看默认配置:

```bash
$ git config -l
core.symlinks=false
core.autocrlf=input
core.fscache=true
color.diff=auto
color.status=auto
color.branch=auto
color.interactive=true
help.format=html
http.sslcainfo=D:/Program Files/Git/mingw64/ssl/certs/ca-bundle.crt
diff.astextplain.textconv=astextplain
rebase.autosquash=true
core.longpaths=true
user.name=utf7
user.email=utf7@xxx.com
core.editor=vim
gitreview.username=xxx
commit.template=D:/Users/utf7/.gitcommit
push.default=simple
gui.recentrepo=E:/git/Blog
core.repositoryformatversion=0
core.filemode=false
core.bare=false
core.logallrefupdates=true
core.symlinks=false
core.ignorecase=true
core.hidedotfiles=dotGitOnly
remote.origin.url=git@github.com:utf7/utf7.github.io.git
remote.origin.fetch=+refs/heads/*:refs/remotes/origin/*
branch.master.remote=origin
branch.master.merge=refs/heads/master
```
