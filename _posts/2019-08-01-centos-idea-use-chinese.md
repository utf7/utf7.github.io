---
layout: post
title: Centos IDEA 无法使用拼音
description: Centos Idea 无法使用拼音
categories: IDE
keywords: IDE,IDEA,拼音
excerpt: Centos Idea 无法使用拼音
---

## **centos 7 下 idea 无法使用中文解决办法**


vim ${IDEA_HOME}/bin/idea.sh 添加如下即可：

export XMODIFIERS="@im=ibus"

export GTK_IM_MODULE="ibus"

export QT_IM_MODULE="ibus"
