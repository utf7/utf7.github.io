---
layout: post
title: Git/SVN 常用命令笔记
description: Git和SVN常见命令
keywords: git, svn
---

## Git和SVN常用命令

#### **查看git配置**
	``` git config -l ```

#### 设置配置
	``` git config key value ```
#### **下载源码**
   ``` git clone xx@xx:/xxx.git ```
    
#### **更新源码**
    git pull

#### **分支相关**
    git branch --查看分支
    git checkout -b name  --创建分支

#### **更新相关**
    git add . -- 增加新的内容
    git commit -m '修改的信息' -- 提交的内容的信息
    git push -u origin master -- 将内容提交到主分支
    
#### **Git状态**
    git status

#### **查看提交内容的差异**
    git log -p -1(1是最新的一条)
### **放弃本地所有修改**
	```
	git reset --hard ORIGIN/BRANCH
	比如：
	git reset --hard origin/master
    ```	
 
### **SVN相关**

#### **将文件下载到本地**
    svn checkout path(服务器上的目录)
    //简写 svn co

#### **往版本库添加新文件**
    svn add file(文件名)

#### **提交文件到版本库**
    svn commit -m 'logMassage' (文件名)
    
#### **加锁／解锁**
    svn lock -m 'lockMessage' (文件名)
    svn unlock path

#### **更新到某个版本**
    svn update -r m path -- m是版本号，path为文件名
    //简写 svn up

#### **查看文件或者目录状态**
    svn status path
    
#### **删除文件**
    svn delete path -m 'delete message'
    //简写 svn (del, remove, rm)
    
#### **查看日志**
    svn log path
    
#### **比较差异**
    svn diff 文件名
    //简写 svn di