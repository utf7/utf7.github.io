---
layout: post
title: 给容器镜像瘦身的一个小技巧
description: 给容器镜像瘦身的一个小tip
categories: [Docker]
keywords: Docker
excerpt: 给容器镜像瘦身的一个小tip
---



## 1.镜像瘦身


执行完 `yum` 命令以后，可以删除 `cache`

```
 yum -q clean all && \
 rm -rf /var/cache/yum && \
 ```
 
如:

https://github.com/utf7/Dockerfile/edit/master/jdk/jdk11/Dockerfile

这个镜像清理yum cache 可以减少 130多M

<img width="998" alt="镜像大小的比较" src="/images/posts/k8s/dockerfile/clear-yum.jpg">
